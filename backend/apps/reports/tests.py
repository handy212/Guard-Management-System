from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role
from apps.clients.models import Client
from apps.guards.models import GuardProfile
from apps.incidents.models import ClientComplaint, IncidentReport
from apps.patrols.models import Checkpoint, PatrolRecord, PatrolRoute, PatrolRouteCheckpoint
from apps.reports.models import ReportRequest
from apps.shifts.models import AttendanceRecord, GuardAssignment, Shift
from apps.sites.models import Site


class ReportRequestApiTests(APITestCase):
    def setUp(self):
        permission = Permission.objects.create(code="reports.view", name="View reports")
        role = Role.objects.create(code="reporter", name="Reporter")
        role.permissions.add(permission)
        self.user = get_user_model().objects.create_user(username="reporter", password="StrongPass123!", role=role)
        self.client_record = Client.objects.create(name="Client One", code="client-one")
        self.site = Site.objects.create(client=self.client_record, name="HQ", code="hq")

    def authenticate(self):
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_report_request(self):
        self.authenticate()

        response = self.client.post(
            reverse("reportrequest-list"),
            {
                "client": self.client_record.id,
                "site": self.site.id,
                "report_type": "client_service",
                "date_from": timezone.localdate(),
                "date_to": timezone.localdate(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["report_type"], "client_service")
        self.assertEqual(response.data["requested_by"], self.user.id)

    def test_client_portal_user_is_scoped_to_linked_client(self):
        other_client = Client.objects.create(name="Client Two", code="client-two")
        other_site = Site.objects.create(client=other_client, name="Remote", code="remote")
        portal_user = get_user_model().objects.create_user(
            username="portal-reporter",
            password="StrongPass123!",
            role=self.user.role,
            client=self.client_record,
        )
        own_request = ReportRequest.objects.create(
            requested_by=portal_user,
            client=self.client_record,
            site=self.site,
            report_type=ReportRequest.ReportType.CLIENT_SERVICE,
        )
        ReportRequest.objects.create(
            requested_by=self.user,
            client=other_client,
            site=other_site,
            report_type=ReportRequest.ReportType.CLIENT_SERVICE,
        )
        token = Token.objects.create(user=portal_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        list_response = self.client.get(reverse("reportrequest-list"))
        create_response = self.client.post(
            reverse("reportrequest-list"),
            {
                "client": other_client.id,
                "site": other_site.id,
                "report_type": "client_service",
            },
            format="json",
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual([row["id"] for row in list_response.data["results"]], [own_request.id])
        self.assertEqual(create_response.status_code, 400)
        self.assertIn("client", create_response.data)


class ReportGenerationTests(APITestCase):
    def setUp(self):
        permission = Permission.objects.create(code="reports.view", name="View reports")
        role = Role.objects.create(code="reporter", name="Reporter")
        role.permissions.add(permission)
        self.user = get_user_model().objects.create_user(username="reporter", password="StrongPass123!", role=role)
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.client_record = Client.objects.create(name="Client One", code="client-one")
        self.site = Site.objects.create(client=self.client_record, name="HQ", code="hq")
        guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard")
        route = PatrolRoute.objects.create(site=self.site, name="Route One", code="route-one")
        checkpoint = Checkpoint.objects.create(site=self.site, name="Gate", code="cp-1")
        PatrolRouteCheckpoint.objects.create(route=route, checkpoint=checkpoint, sequence=1, expected_offset_minutes=0)
        starts_at = timezone.now().replace(microsecond=0)
        shift = Shift.objects.create(site=self.site, name="Night", starts_at=starts_at, ends_at=starts_at + timedelta(hours=8))
        assignment = GuardAssignment.objects.create(guard=guard, shift=shift, patrol_route=route)
        AttendanceRecord.objects.create(assignment=assignment, checked_in_at=starts_at + timedelta(minutes=5))
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="r1",
            route=route,
            guard=guard,
            checkpoint=checkpoint,
            device_number="reader-1",
            occurred_at=starts_at + timedelta(minutes=10),
        )
        IncidentReport.objects.create(site=self.site, title="Open gate", description="Gate left open", occurred_at=starts_at)
        ClientComplaint.objects.create(client=self.client_record, site=self.site, title="Missed patrol", description="Complaint text")

    def test_generate_action_returns_summary_and_marks_completed(self):
        report_request = ReportRequest.objects.create(
            requested_by=self.user,
            client=self.client_record,
            site=self.site,
            report_type=ReportRequest.ReportType.CLIENT_SERVICE,
            date_from=timezone.localdate(),
            date_to=timezone.localdate(),
        )

        response = self.client.post(reverse("reportrequest-generate", kwargs={"pk": report_request.id}), {}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], ReportRequest.Status.COMPLETED)
        self.assertEqual(response.data["summary"]["totals"]["assignments"], 1)
        report_request.refresh_from_db()
        self.assertIn("summary", report_request.parameters)

    def test_export_action_returns_csv(self):
        report_request = ReportRequest.objects.create(
            requested_by=self.user,
            client=self.client_record,
            site=self.site,
            report_type=ReportRequest.ReportType.CLIENT_SERVICE,
            date_from=timezone.localdate(),
            date_to=timezone.localdate(),
        )

        response = self.client.get(reverse("reportrequest-export", kwargs={"pk": report_request.id}))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn("attachment; filename=", response["Content-Disposition"])


class IncidentAttachmentTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(username="admin-attach", password="StrongPass123!", email="attach@test.local")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        client = Client.objects.create(name="Client One", code="client-one")
        self.site = Site.objects.create(client=client, name="HQ", code="hq")

    def test_incident_supports_attachment_upload(self):
        upload = SimpleUploadedFile("evidence.txt", b"incident evidence", content_type="text/plain")
        response = self.client.post(
            reverse("incidentreport-list"),
            {
                "site": self.site.id,
                "title": "Broken gate",
                "description": "Gate latch is broken.",
                "severity": "high",
                "occurred_at": timezone.now().isoformat(),
                "attachment": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["attachment"])
