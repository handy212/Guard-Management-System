from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.audits.models import AuditLog
from apps.clients.models import Client


class AuditLogAccessTests(APITestCase):
    def setUp(self):
        AuditLog.objects.create(action="create", entity_type="clients.Client", summary="created client")

    def test_audit_log_requires_internal_user(self):
        client = Client.objects.create(name="Client One", code="client-one")
        portal_user = get_user_model().objects.create_user(
            username="portal-audit",
            password="StrongPass123!",
            client=client,
        )
        token = Token.objects.create(user=portal_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get(reverse("auditlog-list"))

        self.assertEqual(response.status_code, 403)

    def test_internal_user_can_read_audit_log(self):
        user = get_user_model().objects.create_user(username="internal-audit", password="StrongPass123!")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get(reverse("auditlog-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
