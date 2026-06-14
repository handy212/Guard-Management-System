from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role
from apps.clients.models import Client
from apps.incidents.models import ClientComplaint
from apps.sites.models import Site


class ClientComplaintScopingTests(APITestCase):
    def setUp(self):
        permission = Permission.objects.create(code="reports.view", name="View reports")
        role = Role.objects.create(code="client-reporter", name="Client Reporter")
        role.permissions.add(permission)
        self.client_org = Client.objects.create(name="Client One", code="client-one")
        other_client = Client.objects.create(name="Client Two", code="client-two")
        self.site = Site.objects.create(client=self.client_org, name="HQ", code="hq")
        other_site = Site.objects.create(client=other_client, name="Remote", code="remote")
        self.own_complaint = ClientComplaint.objects.create(
            client=self.client_org,
            site=self.site,
            title="Own complaint",
            description="Scoped complaint",
        )
        ClientComplaint.objects.create(
            client=other_client,
            site=other_site,
            title="Other complaint",
            description="Should not be visible",
        )
        portal_user = get_user_model().objects.create_user(
            username="portal-complaints",
            password="StrongPass123!",
            role=role,
            client=self.client_org,
        )
        token = Token.objects.create(user=portal_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_client_portal_user_only_sees_own_complaints(self):
        response = self.client.get(reverse("clientcomplaint-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["id"] for row in response.data], [self.own_complaint.id])
