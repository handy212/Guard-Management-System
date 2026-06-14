from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        ttl_seconds = getattr(settings, "AUTH_TOKEN_TTL_SECONDS", 0)
        if ttl_seconds > 0 and timezone.now() - token.created > timedelta(seconds=ttl_seconds):
            token.delete()
            raise AuthenticationFailed("Token expired.")
        return user, token
