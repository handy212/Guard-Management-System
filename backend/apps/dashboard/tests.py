from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.clients.models import Client
from apps.devices.models import PatrolDevice
from apps.guards.models import GuardProfile
from apps.incidents.models import IncidentReport
from apps.patrols.models import Checkpoint, PatrolException, PatrolRecord, PatrolRoute, PatrolRouteCheckpoint
from apps.shifts.models import AttendanceRecord, GuardAssignment, Shift
from apps.sites.models import Site


class DashboardSummaryTests(APITestCase):
    def test_summary_requires_authentication(self):
        client = Client.objects.create(name="Client One", code="client-one")
        Site.objects.create(client=client, name="HQ", code="hq")

        response = self.client.get(reverse("dashboard-summary"))

        self.assertEqual(response.status_code, 401)

    def test_summary_returns_counts_for_internal_user(self):
        user = get_user_model().objects.create_user(username="ops-summary", password="StrongPass123!")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        client = Client.objects.create(name="Client One", code="client-one")
        Site.objects.create(client=client, name="HQ", code="hq")

        response = self.client.get(reverse("dashboard-summary"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["clients"], 1)
        self.assertEqual(response.data["sites"], 1)
        self.assertIn("open_incidents", response.data)

    def test_summary_denies_client_portal_user(self):
        client = Client.objects.create(name="Client One", code="client-one")
        user = get_user_model().objects.create_user(username="client-summary", password="StrongPass123!", client=client)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get(reverse("dashboard-summary"))

        self.assertEqual(response.status_code, 403)


class ClientPortalSummaryTests(APITestCase):
    def authenticate(self, user):
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_client_portal_summary_is_scoped_to_user_client(self):
        client_one = Client.objects.create(name="Client One", code="client-one")
        client_two = Client.objects.create(name="Client Two", code="client-two")
        site_one = Site.objects.create(client=client_one, name="HQ", code="hq")
        Site.objects.create(client=client_two, name="Remote", code="remote")
        PatrolDevice.objects.create(site=site_one, name="Reader", device_number="reader-1")
        user = get_user_model().objects.create_user(username="client-user", password="StrongPass123!", client=client_one)
        self.authenticate(user)

        response = self.client.get(reverse("client-portal-summary"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["client"]["code"], "client-one")
        self.assertEqual(response.data["sites"], 1)
        self.assertEqual(response.data["devices"], 1)

    def test_client_portal_summary_denies_unlinked_user(self):
        user = get_user_model().objects.create_user(username="unlinked", password="StrongPass123!")
        self.authenticate(user)

        response = self.client.get(reverse("client-portal-summary"))

        self.assertEqual(response.status_code, 403)


class OperationsOverviewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="ops-user", password="StrongPass123!")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        client = Client.objects.create(name="Client One", code="client-one")
        site = Site.objects.create(client=client, name="HQ", code="hq", required_guards=2)
        guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard")
        device = PatrolDevice.objects.create(site=site, name="Reader", device_number="reader-1")
        route = PatrolRoute.objects.create(site=site, name="Night Route", code="night-route")
        checkpoint = Checkpoint.objects.create(site=site, name="Gate", code="cp-1")
        PatrolRouteCheckpoint.objects.create(route=route, checkpoint=checkpoint, sequence=1, expected_offset_minutes=0)
        starts_at = timezone.now().replace(microsecond=0) - timedelta(minutes=30)
        shift = Shift.objects.create(site=site, name="Night", starts_at=starts_at, ends_at=starts_at + timedelta(hours=8))
        assignment = GuardAssignment.objects.create(guard=guard, shift=shift, patrol_route=route, patrol_device=device)
        AttendanceRecord.objects.create(assignment=assignment, checked_in_at=starts_at + timedelta(minutes=5))
        PatrolException.objects.create(
            assignment=assignment,
            route=route,
            checkpoint=checkpoint,
            exception_type=PatrolException.ExceptionType.MISSED_CHECKPOINT,
            status=PatrolException.Status.OPEN,
        )

    def test_operations_overview_returns_workflow_sections(self):
        response = self.client.get(reverse("dashboard-operations"))

        self.assertEqual(response.status_code, 200)
        self.assertIn("metrics", response.data)
        self.assertIn("assignment_board", response.data)
        self.assertIn("site_performance", response.data)
        self.assertEqual(response.data["metrics"]["late_guards"], 1)
        self.assertEqual(len(response.data["patrol_exceptions"]), 1)

    def test_operations_overview_denies_client_portal_user(self):
        client = Client.objects.create(name="Client Portal Org", code="portal-org")
        user = get_user_model().objects.create_user(
            username="client-ops-user",
            password="StrongPass123!",
            client=client,
        )
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get(reverse("dashboard-operations"))

        self.assertEqual(response.status_code, 403)


class ClientPortalOverviewTests(APITestCase):
    def setUp(self):
        self.client_org = Client.objects.create(name="Client One", code="client-one")
        self.other_client = Client.objects.create(name="Client Two", code="client-two")
        self.site = Site.objects.create(client=self.client_org, name="HQ", code="hq", required_guards=3)
        other_site = Site.objects.create(client=self.other_client, name="Remote", code="remote")
        self.user = get_user_model().objects.create_user(
            username="client-portal-user",
            password="StrongPass123!",
            client=self.client_org,
        )
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        guard = GuardProfile.objects.create(employee_number="G-2", first_name="Jamie", last_name="Guard")
        device = PatrolDevice.objects.create(site=self.site, name="Reader", device_number="reader-2")
        route = PatrolRoute.objects.create(site=self.site, name="Day Route", code="day-route")
        checkpoint = Checkpoint.objects.create(site=self.site, name="Office", code="cp-2")
        PatrolRouteCheckpoint.objects.create(route=route, checkpoint=checkpoint, sequence=1, expected_offset_minutes=0)
        starts_at = timezone.now().replace(microsecond=0)
        shift = Shift.objects.create(site=self.site, name="Day", starts_at=starts_at, ends_at=starts_at + timedelta(hours=8))
        assignment = GuardAssignment.objects.create(guard=guard, shift=shift, patrol_route=route, patrol_device=device)
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="portal-1",
            device=device,
            guard=guard,
            route=route,
            checkpoint=checkpoint,
            device_number=device.device_number,
            occurred_at=starts_at + timedelta(minutes=10),
        )
        IncidentReport.objects.create(site=self.site, title="Open gate", description="Gate left open", severity="medium", occurred_at=starts_at)
        Site.objects.filter(id=other_site.id).update(address="Should not leak")

    def test_client_portal_overview_is_scoped(self):
        response = self.client.get(reverse("client-portal-overview"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["client"]["code"], "client-one")
        self.assertEqual(len(response.data["sites"]), 1)
        self.assertEqual(response.data["sites"][0]["name"], "HQ")

    def test_client_portal_can_create_complaint(self):
        response = self.client.post(
            reverse("client-portal-complaints"),
            {
                "site": self.site.id,
                "title": "Late response",
                "description": "Security response was delayed.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["client"], self.client_org.id)
        self.assertEqual(response.data["submitted_by"], self.user.id)

    def test_client_portal_can_request_report(self):
        response = self.client.post(
            reverse("client-portal-report-requests"),
            {
                "site": self.site.id,
                "report_type": "client_service",
                "date_from": timezone.localdate(),
                "date_to": timezone.localdate(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["client"], self.client_org.id)
        self.assertEqual(response.data["status"], "completed")
        self.assertIn("summary", response.data)


class LiveMonitoringTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="ops-live", password="StrongPass123!")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.client_org = Client.objects.create(name="Client One", code="client-one")
        self.site = Site.objects.create(client=self.client_org, name="HQ", code="hq")
        self.guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard", card_number="CARD1")
        self.device = PatrolDevice.objects.create(site=self.site, name="Reader", device_number="reader-live-1")
        self.checkpoint = Checkpoint.objects.create(
            site=self.site,
            name="Gate",
            code="CP1",
            latitude="5.603700",
            longitude="-0.187000",
        )
        starts_at = timezone.now().replace(microsecond=0)
        self.shift = Shift.objects.create(site=self.site, name="Night", starts_at=starts_at, ends_at=starts_at + timedelta(hours=8))
        self.assignment = GuardAssignment.objects.create(
            guard=self.guard,
            shift=self.shift,
            patrol_device=self.device,
        )

    def test_live_monitoring_requires_authentication(self):
        self.client.credentials()
        response = self.client.get(reverse("monitoring-live"))
        self.assertEqual(response.status_code, 401)

    def test_live_monitoring_returns_guard_position_and_recent_scan(self):
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.TCP,
            source_record_id="live-1",
            device=self.device,
            guard=self.guard,
            checkpoint=self.checkpoint,
            device_number=self.device.device_number,
            guard_identifier=self.guard.employee_number,
            checkpoint_identifier=self.checkpoint.code,
            record_type="GPSCheckPoint",
            occurred_at=timezone.now(),
            latitude="5.603900",
            longitude="-0.187200",
            speed="1.20",
            satellites=7,
        )

        response = self.client.get(reverse("monitoring-live"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["guards"]), 1)
        self.assertEqual(response.data["guards"][0]["device_number"], self.device.device_number)
        self.assertEqual(response.data["guards"][0]["latitude"], "5.603900")
        self.assertFalse(response.data["guards"][0]["is_stale"])
        self.assertEqual(len(response.data["recent_scans"]), 1)
        self.assertEqual(response.data["recent_scans"][0]["checkpoint_code"], "CP1")
        self.assertTrue(response.data["checkpoints"][0]["recently_scanned"])

    def test_live_monitoring_filters_by_site(self):
        other_site = Site.objects.create(client=self.client_org, name="Annex", code="annex")
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.TCP,
            source_record_id="live-2",
            device=self.device,
            guard=self.guard,
            checkpoint=self.checkpoint,
            device_number=self.device.device_number,
            occurred_at=timezone.now(),
            latitude="5.603900",
            longitude="-0.187200",
        )
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.TCP,
            source_record_id="live-3",
            device_number="other-device",
            occurred_at=timezone.now(),
            checkpoint=Checkpoint.objects.create(site=other_site, name="Fence", code="CP2", latitude="5.610000", longitude="-0.180000"),
        )

        response = self.client.get(reverse("monitoring-live"), {"site_id": self.site.id})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["guards"]), 1)
        self.assertEqual(response.data["site_id"], self.site.id)
        self.assertTrue(all(item["site_id"] == self.site.id for item in response.data["checkpoints"]))


class LiveMonitoringWebSocketTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="ops-ws", password="StrongPass123!")
        self.token = Token.objects.create(user=self.user)

    def test_build_live_update_payload_includes_guard_and_scan(self):
        from apps.patrols.live_monitoring import build_live_update_payload

        client = Client.objects.create(name="Client One", code="client-one")
        site = Site.objects.create(client=client, name="HQ", code="hq")
        guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard")
        device = PatrolDevice.objects.create(site=site, name="Reader", device_number="reader-ws-1")
        checkpoint = Checkpoint.objects.create(site=site, name="Gate", code="CP1", latitude="5.603700", longitude="-0.187000")
        record = PatrolRecord.objects.create(
            source=PatrolRecord.Source.TCP,
            source_record_id="ws-live-1",
            device=device,
            guard=guard,
            checkpoint=checkpoint,
            device_number=device.device_number,
            record_type="GPSCheckPoint",
            occurred_at=timezone.now(),
            latitude="5.603900",
            longitude="-0.187200",
        )

        payload = build_live_update_payload(record)

        self.assertEqual(payload["type"], "live_update")
        self.assertEqual(payload["scan"]["checkpoint_code"], "CP1")
        self.assertEqual(payload["guard"]["device_number"], device.device_number)
        self.assertIn(site.id, payload["site_ids"])

    def test_websocket_accepts_valid_token(self):
        from asgiref.sync import async_to_sync
        from channels.testing import WebsocketCommunicator

        from config.asgi import application

        async def _run():
            communicator = WebsocketCommunicator(application, f"/ws/monitoring/live/?token={self.token.key}")
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            response = await communicator.receive_json_from()
            self.assertEqual(response["type"], "connected")
            await communicator.disconnect()

        async_to_sync(_run)()
