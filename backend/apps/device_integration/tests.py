import json
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError, URLError

from django.test import SimpleTestCase, override_settings

from .gateways import DeviceCommandResult, FakePatrolDeviceGateway, SdkPatrolDeviceGateway, get_patrol_device_gateway


class _FakeHttpResponse:
    def __init__(self, payload: dict):
        self.payload = json.dumps(payload).encode("utf-8")

    def read(self):
        return self.payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


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
