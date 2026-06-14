import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from rest_framework.authtoken.models import Token


@database_sync_to_async
def authenticate_monitoring_token(token_key: str):
    if not token_key:
        return None
    try:
        token = Token.objects.select_related("user", "user__role").get(key=token_key)
    except Token.DoesNotExist:
        return None

    user = token.user
    if not user.is_active:
        return None
    if getattr(user, "client_id", None) and not user.is_superuser:
        return None
    return user


class LiveMonitoringConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query = parse_qs(self.scope.get("query_string", b"").decode())
        token_key = query.get("token", [""])[0]
        site_id = query.get("site_id", [""])[0]

        user = await authenticate_monitoring_token(token_key)
        if user is None:
            await self.close(code=4401)
            return

        self.user = user
        self.site_id = site_id.strip() or None
        self.groups = ["live_monitoring"]
        if self.site_id:
            self.groups.append(f"live_monitoring_site_{self.site_id}")

        for group_name in self.groups:
            await self.channel_layer.group_add(group_name, self.channel_name)

        await self.accept()
        await self.send(
            text_data=json.dumps(
                {
                    "type": "connected",
                    "generated_at": timezone.now().isoformat(),
                    "site_id": int(self.site_id) if self.site_id else None,
                }
            )
        )

    async def disconnect(self, close_code):
        for group_name in getattr(self, "groups", []):
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def live_update(self, event):
        await self.send(text_data=json.dumps(event["payload"]))
