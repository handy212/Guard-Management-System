from apps.devices.models import PatrolDevice
from apps.patrols.models import PatrolRecord
from apps.patrols.services import import_patrol_records
from django.utils import timezone

from .gateways import DeviceCommandResult, get_patrol_device_gateway


def sync_patrol_device(device: PatrolDevice, *, clear_device_after_sync: bool = True) -> dict:
    gateway = get_patrol_device_gateway()
    metadata = dict(device.sdk_metadata or {})
    is_fake_gateway = gateway.__class__.__name__ == "FakePatrolDeviceGateway"

    open_result = gateway.open_device()
    records_result = DeviceCommandResult(False, code=-1, message="Device connection was not opened.")
    clear_result = None

    try:
        if open_result.success:
            records_result = gateway.get_records(
                filename=f"device-{device.device_number}-records.txt",
                encrypted=0,
            )

        pending_records = records_result.payload.get("records")
        if pending_records is None or (is_fake_gateway and not pending_records):
            pending_records = metadata.get("pending_records", [])

        imported = import_patrol_records(
            pending_records,
            default_source=(
                PatrolRecord.Source.USB
                if device.connection_mode == PatrolDevice.ConnectionMode.USB
                else PatrolRecord.Source.TCP
            ),
            default_device=device,
        )

        if clear_device_after_sync and pending_records and open_result.success:
            clear_result = gateway.clear_records()
            if clear_result.success:
                metadata["pending_records"] = []

        metadata["last_sync_result"] = {
            "synced_at": timezone.now().isoformat(),
            "requested_clear": clear_device_after_sync,
            "imported_count": imported["imported_count"],
            "duplicate_count": imported["duplicate_count"],
            "device_gateway": "fake" if is_fake_gateway else "sdk",
        }

        device.sdk_metadata = metadata
        device.last_synced_at = timezone.now()
        device.save(update_fields=["sdk_metadata", "last_synced_at", "updated_at"])
    finally:
        close_result = gateway.close_device() if open_result.success else None

    return {
        "device": device.id,
        "open_result": open_result.__dict__,
        "records_result": records_result.__dict__,
        "import": imported,
        "clear_result": clear_result.__dict__ if clear_result else None,
        "close_result": close_result.__dict__ if close_result else None,
    }


def configure_patrol_device_network(device: PatrolDevice, *, validated_data: dict) -> dict:
    gateway = get_patrol_device_gateway()
    metadata = dict(device.sdk_metadata or {})
    network_mode = validated_data["network_mode"]

    open_result = gateway.open_device()
    config_result = DeviceCommandResult(False, code=-1, message="Device connection was not opened.")
    dial_result = None
    imei_result = None

    try:
        if open_result.success:
            if network_mode == "ip":
                config_result = gateway.set_ip_and_port(
                    ip=validated_data["ip"],
                    port=validated_data["port"],
                )
                network_config = {
                    "network_mode": "ip",
                    "ip": validated_data["ip"],
                    "port": validated_data["port"],
                }
            else:
                config_result = gateway.set_domain(
                    domain=validated_data["domain"],
                    dns=validated_data["dns"],
                    port=validated_data["port"],
                )
                network_config = {
                    "network_mode": "domain",
                    "domain": validated_data["domain"],
                    "dns": validated_data["dns"],
                    "port": validated_data["port"],
                }

            if "apn" in validated_data:
                dial_result = gateway.set_dial_param(
                    apn=validated_data["apn"],
                    userid=validated_data.get("userid", ""),
                    password=validated_data.get("password", ""),
                    pin1=validated_data.get("pin1", ""),
                    pin2=validated_data.get("pin2", ""),
                )

            imei_result = gateway.get_imei()

            if config_result.success:
                metadata["network_config"] = network_config
            if dial_result and dial_result.success:
                metadata["dial_params"] = {
                    "apn": validated_data["apn"],
                    "userid": validated_data.get("userid", ""),
                    "pin1": validated_data.get("pin1", ""),
                    "pin2": validated_data.get("pin2", ""),
                }
            if imei_result.success and imei_result.payload.get("imei"):
                device.imei = imei_result.payload["imei"]
    finally:
        close_result = gateway.close_device() if open_result.success else None

    device.sdk_metadata = metadata
    device.save(update_fields=["imei", "sdk_metadata", "updated_at"])

    return {
        "device": device.id,
        "open_result": open_result.__dict__,
        "config_result": config_result.__dict__,
        "dial_result": dial_result.__dict__ if dial_result else None,
        "imei_result": imei_result.__dict__ if imei_result else None,
        "close_result": close_result.__dict__ if close_result else None,
    }
