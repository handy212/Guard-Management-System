from datetime import timedelta
import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import Permission, Role
from apps.clients.models import Client
from apps.devices.models import PatrolDevice
from apps.guards.models import GuardProfile
from apps.patrols.models import Checkpoint, PatrolException, PatrolRecord, PatrolRoute, PatrolRouteCheckpoint
from apps.patrols.services import evaluate_assignment_patrol
from apps.shifts.models import GuardAssignment, Shift
from apps.sites.models import Site


class _AdapterHttpResponse:
    def __init__(self, payload: dict):
        self.payload = json.dumps(payload).encode("utf-8")

    def read(self):
        return self.payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class PatrolEvaluationTests(APITestCase):
    def setUp(self):
        client = Client.objects.create(name="Client One", code="client-one")
        self.site = Site.objects.create(client=client, name="HQ", code="hq")
        self.guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard")
        self.device = PatrolDevice.objects.create(site=self.site, name="Reader", device_number="reader-1")
        self.route = PatrolRoute.objects.create(site=self.site, name="Route One", code="route-one")
        self.checkpoint_one = Checkpoint.objects.create(site=self.site, name="Gate", code="CP1")
        self.checkpoint_two = Checkpoint.objects.create(site=self.site, name="Back Fence", code="CP2")
        PatrolRouteCheckpoint.objects.create(route=self.route, checkpoint=self.checkpoint_one, sequence=1, expected_offset_minutes=0)
        PatrolRouteCheckpoint.objects.create(route=self.route, checkpoint=self.checkpoint_two, sequence=2, expected_offset_minutes=30)
        starts_at = timezone.now().replace(microsecond=0)
        self.shift = Shift.objects.create(site=self.site, name="Night", starts_at=starts_at, ends_at=starts_at + timedelta(hours=8))
        self.assignment = GuardAssignment.objects.create(guard=self.guard, shift=self.shift, patrol_route=self.route, patrol_device=self.device)

    def test_completed_patrol_has_no_exceptions(self):
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="r1",
            device=self.device,
            guard=self.guard,
            route=self.route,
            checkpoint=self.checkpoint_one,
            device_number=self.device.device_number,
            occurred_at=self.shift.starts_at,
        )
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="r2",
            device=self.device,
            guard=self.guard,
            route=self.route,
            checkpoint=self.checkpoint_two,
            device_number=self.device.device_number,
            occurred_at=self.shift.starts_at + timedelta(minutes=35),
        )

        result = evaluate_assignment_patrol(self.assignment)

        self.assertEqual(result["status"], "completed")
        self.assertEqual(PatrolException.objects.count(), 0)

    def test_missing_checkpoint_creates_exception(self):
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="r1",
            device=self.device,
            guard=self.guard,
            route=self.route,
            checkpoint=self.checkpoint_one,
            device_number=self.device.device_number,
            occurred_at=self.shift.starts_at,
        )

        result = evaluate_assignment_patrol(self.assignment)

        self.assertEqual(result["status"], "exceptions")
        self.assertEqual(PatrolException.objects.count(), 1)
        self.assertEqual(PatrolException.objects.first().exception_type, PatrolException.ExceptionType.MISSED_CHECKPOINT)


class PatrolImportTests(APITestCase):
    def setUp(self):
        client = Client.objects.create(name="Client One", code="client-one")
        self.site = Site.objects.create(client=client, name="HQ", code="hq")
        self.guard = GuardProfile.objects.create(employee_number="G-1", first_name="Alex", last_name="Guard", card_number="CARD-1")
        self.device = PatrolDevice.objects.create(site=self.site, name="Reader", device_number="reader-1")
        self.route = PatrolRoute.objects.create(site=self.site, name="Route One", code="route-one")
        self.checkpoint_one = Checkpoint.objects.create(site=self.site, name="Gate", code="CP1")
        self.checkpoint_two = Checkpoint.objects.create(site=self.site, name="Back Fence", code="CP2")
        PatrolRouteCheckpoint.objects.create(route=self.route, checkpoint=self.checkpoint_one, sequence=1, expected_offset_minutes=0)
        PatrolRouteCheckpoint.objects.create(route=self.route, checkpoint=self.checkpoint_two, sequence=2, expected_offset_minutes=30)
        starts_at = timezone.now().replace(microsecond=0)
        self.shift = Shift.objects.create(site=self.site, name="Night", starts_at=starts_at, ends_at=starts_at + timedelta(hours=8))
        self.assignment = GuardAssignment.objects.create(guard=self.guard, shift=self.shift, patrol_route=self.route, patrol_device=self.device)

        user = get_user_model().objects.create_superuser(username="admin-test", password="StrongPass123!", email="admin@test.local")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_import_endpoint_creates_records_and_evaluates_assignment(self):
        response = self.client.post(
            reverse("patrolrecord-import-placeholder"),
            {
                "source": "manual_import",
                "records": [
                    {
                        "device_number": self.device.device_number,
                        "guard_employee_number": self.guard.employee_number,
                        "route_code": self.route.code,
                        "checkpoint_code": self.checkpoint_one.code,
                        "source_record_id": "r-1",
                        "occurred_at": self.shift.starts_at.isoformat(),
                    },
                    {
                        "device_number": self.device.device_number,
                        "guard_employee_number": self.guard.employee_number,
                        "route_code": self.route.code,
                        "checkpoint_code": self.checkpoint_two.code,
                        "source_record_id": "r-2",
                        "occurred_at": (self.shift.starts_at + timedelta(minutes=20)).isoformat(),
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["imported_count"], 2)
        self.assertEqual(PatrolRecord.objects.count(), 2)
        self.assertEqual(response.data["evaluated_assignments"][0]["status"], "completed")

    def test_import_endpoint_counts_duplicates(self):
        payload = {
            "source": "manual_import",
            "records": [
                {
                    "device_number": self.device.device_number,
                    "guard_employee_number": self.guard.employee_number,
                    "checkpoint_code": self.checkpoint_one.code,
                    "source_record_id": "dup-1",
                    "occurred_at": self.shift.starts_at.isoformat(),
                }
            ],
        }

        first_response = self.client.post(reverse("patrolrecord-import-placeholder"), payload, format="json")
        second_response = self.client.post(reverse("patrolrecord-import-placeholder"), payload, format="json")

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 201)
        self.assertEqual(second_response.data["duplicate_count"], 1)
        self.assertEqual(PatrolRecord.objects.count(), 1)

    @override_settings(DEVICE_GATEWAY="fake")
    def test_device_sync_imports_pending_records(self):
        self.device.sdk_metadata = {
            "pending_records": [
                {
                    "device_number": self.device.device_number,
                    "guard_card_number": self.guard.card_number,
                    "route_code": self.route.code,
                    "checkpoint_code": self.checkpoint_one.code,
                    "source_record_id": "sync-1",
                    "occurred_at": self.shift.starts_at.isoformat(),
                }
            ]
        }
        self.device.save(update_fields=["sdk_metadata", "updated_at"])

        response = self.client.post(
            reverse("patroldevice-sync", kwargs={"pk": self.device.id}),
            {"clear_device_after_sync": True},
            format="json",
        )

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data["import"]["imported_count"], 1)
        self.assertTrue(response.data["open_result"]["success"])
        self.assertTrue(response.data["close_result"]["success"])
        self.device.refresh_from_db()
        self.assertEqual(self.device.sdk_metadata["pending_records"], [])

    @override_settings(DEVICE_GATEWAY="sdk")
    @patch("apps.device_integration.gateways.request.urlopen")
    def test_device_sync_imports_records_from_adapter(self, mock_urlopen):
        record_payload = {
            "device_number": self.device.device_number,
            "guard_card_number": self.guard.card_number,
            "route_code": self.route.code,
            "checkpoint_code": self.checkpoint_one.code,
            "source_record_id": "adapter-sync-1",
            "occurred_at": self.shift.starts_at.isoformat(),
        }

        def adapter_response(request, timeout=None):
            body = json.loads(request.data.decode("utf-8"))
            if body["command"] == "OpenDevice":
                payload = {"success": True, "code": 0, "message": "ok", "payload": {"opened": True}}
            elif body["command"] == "GetRecords":
                payload = {
                    "success": True,
                    "code": 0,
                    "message": "ok",
                    "payload": {"filename": body["payload"]["filename"], "encrypted": 0, "records": [record_payload]},
                }
            elif body["command"] == "ClearRecords":
                payload = {"success": True, "code": 0, "message": "ok", "payload": {"cleared": True}}
            else:
                payload = {"success": True, "code": 0, "message": "ok", "payload": {"closed": True}}
            return _AdapterHttpResponse(payload)

        mock_urlopen.side_effect = adapter_response

        self.device.sdk_metadata = {
            "pending_records": [
                {
                    "device_number": self.device.device_number,
                    "source_record_id": "metadata-only",
                    "occurred_at": self.shift.starts_at.isoformat(),
                }
            ]
        }
        self.device.save(update_fields=["sdk_metadata", "updated_at"])

        response = self.client.post(
            reverse("patroldevice-sync", kwargs={"pk": self.device.id}),
            {"clear_device_after_sync": True},
            format="json",
        )

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data["import"]["imported_count"], 1)
        self.assertEqual(response.data["records_result"]["payload"]["records"][0]["source_record_id"], "adapter-sync-1")
        self.device.refresh_from_db()
        self.assertEqual(self.device.sdk_metadata["last_sync_result"]["device_gateway"], "sdk")

    @override_settings(DEVICE_GATEWAY="fake")
    def test_device_sync_placeholder_route_still_works(self):
        self.device.sdk_metadata = {
            "pending_records": [
                {
                    "device_number": self.device.device_number,
                    "guard_card_number": self.guard.card_number,
                    "checkpoint_code": self.checkpoint_one.code,
                    "source_record_id": "legacy-sync-1",
                    "occurred_at": self.shift.starts_at.isoformat(),
                }
            ]
        }
        self.device.save(update_fields=["sdk_metadata", "updated_at"])

        response = self.client.post(
            reverse("patroldevice-sync-placeholder", kwargs={"pk": self.device.id}),
            {"clear_device_after_sync": False},
            format="json",
        )

        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data["import"]["imported_count"], 1)
        self.device.refresh_from_db()
        self.assertEqual(len(self.device.sdk_metadata["pending_records"]), 1)

    def test_configure_network_persists_fake_gateway_configuration(self):
        response = self.client.post(
            reverse("patroldevice-configure-network", kwargs={"pk": self.device.id}),
            {
                "network_mode": "domain",
                "domain": "patrol.example.test",
                "dns": "8.8.8.8",
                "port": 8989,
                "apn": "demo-apn",
                "userid": "demo-user",
                "password": "demo-pass",
                "pin1": "1111",
                "pin2": "2222",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["config_result"]["success"])
        self.assertTrue(response.data["dial_result"]["success"])
        self.assertEqual(response.data["imei_result"]["payload"]["imei"], "000000000000000")
        self.device.refresh_from_db()
        self.assertEqual(
            self.device.sdk_metadata["network_config"],
            {
                "network_mode": "domain",
                "domain": "patrol.example.test",
                "dns": "8.8.8.8",
                "port": 8989,
            },
        )
        self.assertEqual(
            self.device.sdk_metadata["dial_params"],
            {
                "apn": "demo-apn",
                "userid": "demo-user",
                "pin1": "1111",
                "pin2": "2222",
            },
        )

    def test_configure_network_requires_mode_specific_fields(self):
        response = self.client.post(
            reverse("patroldevice-configure-network", kwargs={"pk": self.device.id}),
            {"network_mode": "domain", "port": 8989},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("domain", response.data)
        self.assertIn("dns", response.data)


class PatrolReadScopingTests(APITestCase):
    def setUp(self):
        permission = Permission.objects.create(code="reports.view", name="View reports")
        role = Role.objects.create(code="client-reporter", name="Client Reporter")
        role.permissions.add(permission)
        self.client_org = Client.objects.create(name="Client One", code="client-one")
        other_client = Client.objects.create(name="Client Two", code="client-two")
        self.site = Site.objects.create(client=self.client_org, name="HQ", code="hq")
        other_site = Site.objects.create(client=other_client, name="Remote", code="remote")
        self.guard = GuardProfile.objects.create(employee_number="G-100", first_name="Alex", last_name="Guard")
        self.route = PatrolRoute.objects.create(site=self.site, name="Route One", code="route-one")
        other_route = PatrolRoute.objects.create(site=other_site, name="Route Two", code="route-two")
        self.checkpoint = Checkpoint.objects.create(site=self.site, name="Gate", code="CP1")
        other_checkpoint = Checkpoint.objects.create(site=other_site, name="Fence", code="CP2")
        shift = Shift.objects.create(
            site=self.site,
            name="Night",
            starts_at=timezone.now(),
            ends_at=timezone.now() + timedelta(hours=8),
        )
        other_shift = Shift.objects.create(
            site=other_site,
            name="Remote Night",
            starts_at=timezone.now(),
            ends_at=timezone.now() + timedelta(hours=8),
        )
        assignment = GuardAssignment.objects.create(guard=self.guard, shift=shift, patrol_route=self.route)
        other_assignment = GuardAssignment.objects.create(guard=self.guard, shift=other_shift, patrol_route=other_route)
        self.own_record = PatrolRecord.objects.create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="own-record",
            route=self.route,
            checkpoint=self.checkpoint,
            guard=self.guard,
            device_number="reader-own",
            occurred_at=shift.starts_at,
        )
        PatrolRecord.objects.create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="other-record",
            route=other_route,
            checkpoint=other_checkpoint,
            guard=self.guard,
            device_number="reader-other",
            occurred_at=other_shift.starts_at,
        )
        self.own_exception = PatrolException.objects.create(
            assignment=assignment,
            route=self.route,
            checkpoint=self.checkpoint,
            exception_type=PatrolException.ExceptionType.MISSED_CHECKPOINT,
        )
        PatrolException.objects.create(
            assignment=other_assignment,
            route=other_route,
            checkpoint=other_checkpoint,
            exception_type=PatrolException.ExceptionType.MISSED_CHECKPOINT,
        )
        portal_user = get_user_model().objects.create_user(
            username="portal-reader",
            password="StrongPass123!",
            role=role,
            client=self.client_org,
        )
        token = Token.objects.create(user=portal_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_client_portal_user_only_sees_own_patrol_data(self):
        record_response = self.client.get(reverse("patrolrecord-list"))
        exception_response = self.client.get(reverse("patrolexception-list"))

        self.assertEqual(record_response.status_code, 200)
        self.assertEqual(exception_response.status_code, 200)
        self.assertEqual([row["id"] for row in record_response.data["results"]], [self.own_record.id])
        self.assertEqual([row["id"] for row in exception_response.data["results"]], [self.own_exception.id])
