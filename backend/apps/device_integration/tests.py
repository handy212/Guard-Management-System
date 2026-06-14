import json
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.clients.models import Client
from apps.devices.models import PatrolDevice
from apps.patrols.models import PatrolRecord
from apps.sites.models import Site

from .gateways import DeviceCommandResult, FakePatrolDeviceGateway, SdkPatrolDeviceGateway, get_patrol_device_gateway
from .services import _resolve_pending_records


class _FakeHttpResponse:
    def __init__(self, payload: dict):
        self.payload = json.dumps(payload).encode("utf-8")

    def read(self):
        return self.payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class ResolvePendingRecordsTests(SimpleTestCase):
    def test_sdk_gateway_does_not_fall_back_to_metadata(self):
        records = _resolve_pending_records(
            is_fake_gateway=False,
            records_result_payload={"records": None},
            metadata={"pending_records": [{"source_record_id": "legacy"}]},
        )
        self.assertEqual(records, [])

    def test_fake_gateway_uses_metadata_when_adapter_returns_empty(self):
        records = _resolve_pending_records(
            is_fake_gateway=True,
            records_result_payload={"records": []},
            metadata={"pending_records": [{"source_record_id": "legacy"}]},
        )
        self.assertEqual(records, [{"source_record_id": "legacy"}])


class PatrolDeviceGatewayTests(SimpleTestCase):
    @override_settings(
        DEVICE_GATEWAY="sdk",
        DEVICE_ADAPTER_BASE_URL="http://adapter.local/api/v1/device-adapter",
        DEVICE_ADAPTER_API_TOKEN="secret-token",
        DEVICE_ADAPTER_TIMEOUT_SECONDS=7,
    )
    @patch("apps.device_integration.gateways.request.urlopen")
    def test_sdk_gateway_posts_json_command_to_adapter(self, mock_urlopen):
        mock_urlopen.return_value = _FakeHttpResponse(
            {
                "success": True,
                "code": 0,
                "message": "configured",
                "payload": {"ip": "10.0.0.8", "port": 8989},
            }
        )

        gateway = SdkPatrolDeviceGateway()
        result = gateway.set_ip_and_port("10.0.0.8", 8989)

        self.assertEqual(
            result,
            DeviceCommandResult(True, code=0, message="configured", payload={"ip": "10.0.0.8", "port": 8989}),
        )
        request_arg = mock_urlopen.call_args.args[0]
        self.assertEqual(request_arg.full_url, "http://adapter.local/api/v1/device-adapter/commands")
        self.assertEqual(request_arg.get_method(), "POST")
        self.assertEqual(request_arg.headers["Authorization"], "Bearer secret-token")
        self.assertEqual(
            json.loads(request_arg.data.decode("utf-8")),
            {
                "command": "SetIpAndPort",
                "payload": {"ip": "10.0.0.8", "port": 8989},
            },
        )
        self.assertEqual(mock_urlopen.call_args.kwargs["timeout"], 7)

    @patch("apps.device_integration.gateways.request.urlopen")
    def test_sdk_gateway_returns_http_error_payload(self, mock_urlopen):
        mock_urlopen.side_effect = HTTPError(
            url="http://adapter.local/commands",
            code=503,
            msg="Service Unavailable",
            hdrs=None,
            fp=BytesIO(b'{"message":"adapter offline","payload":{"retryable":true}}'),
        )

        gateway = SdkPatrolDeviceGateway(base_url="http://adapter.local")
        result = gateway.open_device()

        self.assertFalse(result.success)
        self.assertEqual(result.code, 503)
        self.assertEqual(result.message, "adapter offline")
        self.assertEqual(result.payload, {"retryable": True})

    @patch("apps.device_integration.gateways.request.urlopen")
    def test_sdk_gateway_returns_connection_error(self, mock_urlopen):
        mock_urlopen.side_effect = URLError("connection refused")

        gateway = SdkPatrolDeviceGateway(base_url="http://adapter.local")
        result = gateway.get_records("records.txt", encrypted=0)

        self.assertFalse(result.success)
        self.assertEqual(result.code, -1)
        self.assertIn("connection failed", result.message)

    @override_settings(DEVICE_GATEWAY="sdk")
    def test_get_patrol_device_gateway_returns_sdk_gateway(self):
        gateway = get_patrol_device_gateway()
        self.assertIsInstance(gateway, SdkPatrolDeviceGateway)

    @override_settings(DEVICE_GATEWAY="fake")
    def test_get_patrol_device_gateway_returns_fake_gateway(self):
        gateway = get_patrol_device_gateway()
        self.assertIsInstance(gateway, FakePatrolDeviceGateway)


class PatrolRecordIngestViewTests(APITestCase):
    def setUp(self):
        client = Client.objects.create(name="Client One", code="client-one")
        site = Site.objects.create(client=client, name="HQ", code="hq")
        self.device = PatrolDevice.objects.create(site=site, name="Reader", device_number="reader-tcp-1")

    @override_settings(PATROL_INGEST_API_TOKEN="")
    def test_ingest_rejects_when_token_not_configured(self):
        response = self.client.post(
            reverse("patrol-record-ingest"),
            {"records": []},
            format="json",
            HTTP_AUTHORIZATION="Bearer change-me-ingest-token",
        )
        self.assertEqual(response.status_code, 503)

    @override_settings(PATROL_INGEST_API_TOKEN="change-me-ingest-token")
    def test_ingest_rejects_missing_token(self):
        response = self.client.post(reverse("patrol-record-ingest"), {"records": []}, format="json")
        self.assertEqual(response.status_code, 403)

    @override_settings(PATROL_INGEST_API_TOKEN="change-me-ingest-token")
    def test_ingest_accepts_bearer_token_and_imports_tcp_record(self):
        occurred_at = timezone.now().replace(microsecond=0).isoformat()
        payload = {
            "source": "tcp",
            "records": [
                {
                    "source_record_id": "tcp-demo-1",
                    "device_number": self.device.device_number,
                    "guard_card_number": "G001",
                    "checkpoint_code": "CP1",
                    "occurred_at": occurred_at,
                    "record_type": "patrol",
                    "information": "GPRS push",
                }
            ],
        }
        response = self.client.post(
            reverse("patrol-record-ingest"),
            payload,
            format="json",
            HTTP_AUTHORIZATION="Bearer change-me-ingest-token",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["imported_count"], 1)
        record = PatrolRecord.objects.get(source_record_id="tcp-demo-1")
        self.assertEqual(record.source, PatrolRecord.Source.TCP)
        self.assertEqual(record.device_number, self.device.device_number)

    @override_settings(PATROL_INGEST_API_TOKEN="change-me-ingest-token")
    def test_ingest_accepts_gps_coordinates_without_json_error(self):
        occurred_at = timezone.now().replace(microsecond=0).isoformat()
        payload = {
            "source": "tcp",
            "records": [
                {
                    "source_record_id": "tcp-gps-1",
                    "device_number": self.device.device_number,
                    "guard_card_number": "G001",
                    "checkpoint_code": "CP1",
                    "occurred_at": occurred_at,
                    "record_type": "GPSCheckPoint",
                    "latitude": "5.604100",
                    "longitude": "-0.187300",
                    "speed": "1.25",
                    "satellites": 7,
                }
            ],
        }
        response = self.client.post(
            reverse("patrol-record-ingest"),
            payload,
            format="json",
            HTTP_AUTHORIZATION="Bearer change-me-ingest-token",
        )
        self.assertEqual(response.status_code, 201)
        record = PatrolRecord.objects.get(source_record_id="tcp-gps-1")
        self.assertEqual(str(record.latitude), "5.604100")
        self.assertIn("latitude", record.raw_payload)
