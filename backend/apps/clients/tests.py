from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role
from apps.audits.models import AuditLog
from apps.clients.models import Client


class ClientPermissionAuditTests(APITestCase):
    def setUp(self):
        manage_clients = Permission.objects.create(code="clients.manage", name="Manage clients")
        view_clients = Permission.objects.create(code="clients.view", name="View clients")
        self.admin_role = Role.objects.create(code="admin", name="Admin")
        self.admin_role.permissions.set([manage_clients, view_clients])
        self.read_role = Role.objects.create(code="reader", name="Reader")
        self.read_role.permissions.set([view_clients])
        User = get_user_model()
        self.admin_user = User.objects.create_user(username="admin-user", password="StrongPass123!", role=self.admin_role)
        self.read_user = User.objects.create_user(username="read-user", password="StrongPass123!", role=self.read_role)

    def authenticate(self, user):
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_unauthenticated_client_list_is_denied(self):
        response = self.client.get(reverse("client-list"))

        self.assertEqual(response.status_code, 401)

    def test_read_permission_can_list_clients(self):
        Client.objects.create(name="Client One", code="client-one")
        self.authenticate(self.read_user)

        response = self.client.get(reverse("client-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["code"], "client-one")

    def test_manage_permission_can_create_client_and_writes_audit_log(self):
        self.authenticate(self.admin_user)

        response = self.client.post(reverse("client-list"), {"name": "Client Two", "code": "client-two"}, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Client.objects.filter(code="client-two").exists())
        self.assertTrue(AuditLog.objects.filter(action="create", entity_type="clients.Client").exists())
