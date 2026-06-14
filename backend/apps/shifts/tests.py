from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.clients.models import Client
from apps.devices.models import PatrolDevice
from apps.guards.models import GuardProfile
from apps.patrols.models import Checkpoint, PatrolRoute, PatrolRouteCheckpoint
from apps.shifts.models import AttendanceRecord, GuardAssignment, Shift
from apps.sites.models import Site


class GuardAssignmentActionsTests(APITestCase):
    def setUp(self):
        client = Client.objects.create(name="Client One", code="client-one")
        site = Site.objects.create(client=client, name="HQ", code="hq")
        self.guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard")
        self.device = PatrolDevice.objects.create(site=site, name="Reader", device_number="reader-1")
        self.route = PatrolRoute.objects.create(site=site, name="Route One", code="route-one")
        checkpoint = Checkpoint.objects.create(site=site, name="Gate", code="cp-1")
        PatrolRouteCheckpoint.objects.create(route=self.route, checkpoint=checkpoint, sequence=1, expected_offset_minutes=0)
        starts_at = timezone.now().replace(microsecond=0)
        shift = Shift.objects.create(site=site, name="Night", starts_at=starts_at, ends_at=starts_at + timedelta(hours=8))
        self.assignment = GuardAssignment.objects.create(guard=self.guard, shift=shift, patrol_route=self.route, patrol_device=self.device)

        user = get_user_model().objects.create_superuser(username="admin-shifts", password="StrongPass123!", email="admin@shift.local")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_confirm_deployment_marks_assignment_confirmed(self):
        response = self.client.post(reverse("guardassignment-confirm-deployment", kwargs={"pk": self.assignment.id}), {}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, GuardAssignment.Status.CONFIRMED)
        self.assertIsNotNone(self.assignment.deployment_confirmed_at)

    def test_check_in_and_check_out_create_attendance_and_complete_assignment(self):
        check_in_response = self.client.post(reverse("guardassignment-check-in", kwargs={"pk": self.assignment.id}), {}, format="json")
        check_out_response = self.client.post(reverse("guardassignment-check-out", kwargs={"pk": self.assignment.id}), {}, format="json")

        self.assertEqual(check_in_response.status_code, 200)
        self.assertEqual(check_out_response.status_code, 200)
        attendance = AttendanceRecord.objects.get(assignment=self.assignment)
        self.assertIsNotNone(attendance.checked_in_at)
        self.assertIsNotNone(attendance.checked_out_at)
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, GuardAssignment.Status.COMPLETED)

    def test_check_in_rejects_invalid_datetime(self):
        response = self.client.post(
            reverse("guardassignment-check-in", kwargs={"pk": self.assignment.id}),
            {"checked_in_at": "not-a-datetime"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("checked_in_at", response.data)
