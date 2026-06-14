from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.clients.models import Client


class AuthApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operator", password="StrongPass123!")

    def test_login_returns_token_user_and_expiry(self):
        response = self.client.post(reverse("auth-login"), {"username": "operator", "password": "StrongPass123!"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        self.assertIn("expires_at", response.data)
        self.assertEqual(response.data["user"]["username"], "operator")

    def test_me_requires_token(self):
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "operator")

    def test_logout_deletes_token(self):
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(reverse("auth-logout"))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_expired_token_is_rejected(self):
        with self.settings(AUTH_TOKEN_TTL_SECONDS=3600):
            token = Token.objects.create(user=self.user)
            Token.objects.filter(pk=token.pk).update(created=timezone.now() - timezone.timedelta(hours=2))
            self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

            response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, 401)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_client_portal_user_without_role_cannot_access_admin_site_list(self):
        client_org = Client.objects.create(name="Portal Co", code="portal-co")
        portal_user = get_user_model().objects.create_user(username="portal", password="StrongPass123!", client=client_org)
        token = Token.objects.create(user=portal_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get(reverse("site-list"))

        self.assertEqual(response.status_code, 403)
