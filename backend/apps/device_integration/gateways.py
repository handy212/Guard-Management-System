from dataclasses import dataclass, field
from datetime import datetime
import json
from typing import Protocol
from urllib import error, request

from django.conf import settings


@dataclass(frozen=True)
class DeviceCommandResult:
    success: bool
    code: int = 0
    message: str = "ok"
    payload: dict = field(default_factory=dict)


class PatrolDeviceGateway(Protocol):
    def open_device(self) -> DeviceCommandResult: ...
    def close_device(self) -> DeviceCommandResult: ...
    def get_device_id(self) -> DeviceCommandResult: ...
    def verify(self, value: int) -> DeviceCommandResult: ...
    def set_datetime(self, value: datetime) -> DeviceCommandResult: ...
    def get_records(self, filename: str, encrypted: int = 0) -> DeviceCommandResult: ...
    def clear_records(self) -> DeviceCommandResult: ...
    def set_agent(self, agent: str) -> DeviceCommandResult: ...
    def get_agent(self) -> DeviceCommandResult: ...
    def set_read_data_callback(self) -> DeviceCommandResult: ...
    def set_ip_and_port(self, ip: str, port: int) -> DeviceCommandResult: ...
    def set_domain(self, domain: str, dns: str, port: int) -> DeviceCommandResult: ...
    def set_dial_param(self, apn: str, userid: str, password: str, pin1: str, pin2: str) -> DeviceCommandResult: ...
    def get_imei(self) -> DeviceCommandResult: ...
    def set_checkpoint(self, checkpoints: str) -> DeviceCommandResult: ...
    def get_checkpoint(self) -> DeviceCommandResult: ...
    def get_max_checkpoint(self) -> DeviceCommandResult: ...
    def generate_voice_file(self, sys_voice_folder: str, output_folder: str, text: str) -> DeviceCommandResult: ...
    def download_voice(self, filename: str) -> DeviceCommandResult: ...


class FakePatrolDeviceGateway:
    def open_device(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"opened": True})

    def close_device(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"closed": True})

    def get_device_id(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"device_id": "FAKE-DEVICE-001"})

    def verify(self, value: int) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"verified": value})

    def set_datetime(self, value: datetime) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"datetime": value.isoformat()})

    def get_records(self, filename: str, encrypted: int = 0) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"filename": filename, "encrypted": encrypted, "records": []})

    def clear_records(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"cleared": True})

    def set_agent(self, agent: str) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"agent": agent})

    def get_agent(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"agent": "Fake Agent"})

    def set_read_data_callback(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"callback_registered": True})

    def set_ip_and_port(self, ip: str, port: int) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"ip": ip, "port": port})

    def set_domain(self, domain: str, dns: str, port: int) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"domain": domain, "dns": dns, "port": port})

    def set_dial_param(self, apn: str, userid: str, password: str, pin1: str, pin2: str) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"apn": apn, "userid": userid, "pin1": pin1, "pin2": pin2})

    def get_imei(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"imei": "000000000000000"})

    def set_checkpoint(self, checkpoints: str) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"checkpoints": checkpoints})

    def get_checkpoint(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"checkpoints": ""})

    def get_max_checkpoint(self) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"max_checkpoints": 0})

    def generate_voice_file(self, sys_voice_folder: str, output_folder: str, text: str) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"sys_voice_folder": sys_voice_folder, "output_folder": output_folder, "text": text})

    def download_voice(self, filename: str) -> DeviceCommandResult:
        return DeviceCommandResult(True, payload={"filename": filename})


class SdkPatrolDeviceGateway:
    def __init__(self, *, base_url: str | None = None, api_token: str | None = None, timeout: int | None = None):
        self.base_url = (base_url or settings.DEVICE_ADAPTER_BASE_URL).rstrip("/")
        self.api_token = api_token if api_token is not None else settings.DEVICE_ADAPTER_API_TOKEN
        self.timeout = timeout if timeout is not None else settings.DEVICE_ADAPTER_TIMEOUT_SECONDS

    def _post_command(self, function_name: str, payload: dict | None = None) -> DeviceCommandResult:
        command_payload = {
            "command": function_name,
            "payload": payload or {},
        }
        encoded_payload = json.dumps(command_payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        adapter_request = request.Request(
            url=f"{self.base_url}/commands",
            data=encoded_payload,
            headers=headers,
            method="POST",
        )

        try:
            with request.urlopen(adapter_request, timeout=self.timeout) as response:
                raw_body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            return self._http_error_result(function_name, exc)
        except error.URLError as exc:
            return DeviceCommandResult(
                False,
                code=-1,
                message=f"{function_name} adapter connection failed: {exc.reason}",
            )

        try:
            response_data = json.loads(raw_body or "{}")
        except json.JSONDecodeError:
            return DeviceCommandResult(
                False,
                code=-1,
                message=f"{function_name} adapter returned invalid JSON.",
                payload={"raw_body": raw_body},
            )

        return DeviceCommandResult(
            bool(response_data.get("success")),
            code=int(response_data.get("code", 0)),
            message=response_data.get("message", "ok"),
            payload=response_data.get("payload") or {},
        )

    def _http_error_result(self, function_name: str, exc: error.HTTPError) -> DeviceCommandResult:
        raw_body = exc.read().decode("utf-8", errors="replace")
        try:
            response_data = json.loads(raw_body or "{}")
        except json.JSONDecodeError:
            response_data = {}

        return DeviceCommandResult(
            False,
            code=int(response_data.get("code", exc.code)),
            message=response_data.get("message") or f"{function_name} adapter returned HTTP {exc.code}.",
            payload=response_data.get("payload") or {"raw_body": raw_body},
        )

    def open_device(self) -> DeviceCommandResult:
        return self._post_command("OpenDevice")

    def close_device(self) -> DeviceCommandResult:
        return self._post_command("CloseDevice")

    def get_device_id(self) -> DeviceCommandResult:
        return self._post_command("GetDeviceId")

    def verify(self, value: int) -> DeviceCommandResult:
        return self._post_command("Verify", {"value": value})

    def set_datetime(self, value: datetime) -> DeviceCommandResult:
        return self._post_command("SetDateTime", {"value": value.isoformat()})

    def get_records(self, filename: str, encrypted: int = 0) -> DeviceCommandResult:
        return self._post_command("GetRecords", {"filename": filename, "encrypted": encrypted})

    def clear_records(self) -> DeviceCommandResult:
        return self._post_command("ClearRecords")

    def set_agent(self, agent: str) -> DeviceCommandResult:
        return self._post_command("SetAgent", {"agent": agent})

    def get_agent(self) -> DeviceCommandResult:
        return self._post_command("GetAgent")

    def set_read_data_callback(self) -> DeviceCommandResult:
        return self._post_command("SetReadDataCallback")

    def set_ip_and_port(self, ip: str, port: int) -> DeviceCommandResult:
        return self._post_command("SetIpAndPort", {"ip": ip, "port": port})

    def set_domain(self, domain: str, dns: str, port: int) -> DeviceCommandResult:
        return self._post_command("SetDomain", {"domain": domain, "dns": dns, "port": port})

    def set_dial_param(self, apn: str, userid: str, password: str, pin1: str, pin2: str) -> DeviceCommandResult:
        return self._post_command(
            "SetDialParam",
            {"apn": apn, "userid": userid, "password": password, "pin1": pin1, "pin2": pin2},
        )

    def get_imei(self) -> DeviceCommandResult:
        return self._post_command("GetImei")

    def set_checkpoint(self, checkpoints: str) -> DeviceCommandResult:
        return self._post_command("SetCheckPoint", {"checkpoints": checkpoints})

    def get_checkpoint(self) -> DeviceCommandResult:
        return self._post_command("GetCheckPoint")

    def get_max_checkpoint(self) -> DeviceCommandResult:
        return self._post_command("GetMaxCheckPoint")

    def generate_voice_file(self, sys_voice_folder: str, output_folder: str, text: str) -> DeviceCommandResult:
        return self._post_command(
            "GenerateVoiceFile",
            {"sys_voice_folder": sys_voice_folder, "output_folder": output_folder, "text": text},
        )

    def download_voice(self, filename: str) -> DeviceCommandResult:
        return self._post_command("DownloadVoice", {"filename": filename})


def get_patrol_device_gateway() -> PatrolDeviceGateway:
    if settings.DEVICE_GATEWAY == "sdk":
        return SdkPatrolDeviceGateway()
    return FakePatrolDeviceGateway()
