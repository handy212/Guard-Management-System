from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.audits.models import AuditLog
from apps.clients.models import Client
from apps.devices.models import PatrolDevice
from apps.guards.models import GuardProfile
from apps.patrols.models import PatrolRoute
from apps.reports.models import ReportRequest
from apps.shifts.models import GuardAssignment, Shift
from apps.sites.models import Site


class PaginationTests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_superuser(
            username="pager",
            password="StrongPass123!",
            email="pager@test.local",
        )
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        for index in range(30):
            Client.objects.create(name=f"Client {index}", code=f"client-{index}")

    def test_list_endpoints_return_paginated_payload(self):
        response = self.client.get(reverse("client-list"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 30)
        self.assertEqual(len(response.data["results"]), 25)
        self.assertIsNotNone(response.data["next"])

    def test_page_size_query_param_is_respected(self):
        response = self.client.get(reverse("client-list"), {"page_size": 10})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 10)


class CustomActionAuditTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="audit-actions",
            password="StrongPass123!",
            email="audit@test.local",
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        client = Client.objects.create(name="Client One", code="client-one")
        site = Site.objects.create(client=client, name="HQ", code="hq")
        guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard")
        route = PatrolRoute.objects.create(site=site, name="Route One", code="route-one")
        shift = Shift.objects.create(
            site=site,
            name="Night",
            starts_at="2026-06-14T20:00:00Z",
            ends_at="2026-06-15T04:00:00Z",
        )
        self.assignment = GuardAssignment.objects.create(guard=guard, shift=shift, patrol_route=route)
        self.device = PatrolDevice.objects.create(
            site=site,
            name="Reader One",
            device_number="reader-1",
            status=PatrolDevice.Status.ACTIVE,
        )
        self.report_request = ReportRequest.objects.create(
            requested_by=self.user,
            client=client,
            site=site,
            report_type=ReportRequest.ReportType.CLIENT_SERVICE,
        )

    def test_device_sync_writes_audit_log(self):
        response = self.client.post(
            reverse("patroldevice-sync", kwargs={"pk": self.device.id}),
            {"clear_device_after_sync": False},
            format="json",
        )

        self.assertEqual(response.status_code, 202)
        self.assertTrue(
            AuditLog.objects.filter(action="sync", entity_type="devices.PatrolDevice", entity_id=str(self.device.id)).exists()
        )

    def test_assignment_check_in_writes_audit_log(self):
        response = self.client.post(reverse("guardassignment-check-in", kwargs={"pk": self.assignment.id}), {}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            AuditLog.objects.filter(
                action="check_in",
                entity_type="shifts.GuardAssignment",
                entity_id=str(self.assignment.id),
            ).exists()
        )

    def test_report_generate_writes_audit_log(self):
        response = self.client.post(reverse("reportrequest-generate", kwargs={"pk": self.report_request.id}), {}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            AuditLog.objects.filter(
                action="generate",
                entity_type="reports.ReportRequest",
                entity_id=str(self.report_request.id),
            ).exists()
        )
