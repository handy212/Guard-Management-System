from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.db.models import Q
from django.utils import timezone

from apps.patrols.models import Checkpoint, GuardLiveState, PatrolRecord
from apps.patrols.services import _resolve_assignment


CHECKPOINT_RECORD_TYPES = {"normal", "gpscheckpoint"}


def _is_checkpoint_scan(record: PatrolRecord) -> bool:
    record_type = (record.record_type or "").lower()
    return bool(record.checkpoint_id or record.checkpoint_identifier or record_type in CHECKPOINT_RECORD_TYPES)


def _record_site_ids(record: PatrolRecord) -> list[int]:
    site_ids = set()
    if record.device_id and record.device and record.device.site_id:
        site_ids.add(record.device.site_id)
    if record.checkpoint_id and record.checkpoint:
        site_ids.add(record.checkpoint.site_id)
    if record.route_id and record.route:
        site_ids.add(record.route.site_id)
    return sorted(site_ids)


def _serialize_guard_live_state(state: GuardLiveState, *, stale_cutoff) -> dict:
    return {
        "device_id": state.device_id,
        "device_name": state.device.name if state.device else "",
        "device_number": state.device.device_number if state.device else "",
        "guard_id": state.guard_id,
        "guard_name": str(state.guard) if state.guard else state.last_patrol_record.guard_identifier if state.last_patrol_record else "",
        "assignment_id": state.assignment_id,
        "site_id": state.site_id,
        "site_name": state.site.name if state.site else "",
        "latitude": str(state.latitude) if state.latitude is not None else None,
        "longitude": str(state.longitude) if state.longitude is not None else None,
        "speed": str(state.speed) if state.speed is not None else None,
        "satellites": state.satellites,
        "last_seen_at": state.last_seen_at.isoformat(),
        "last_record_type": state.last_record_type,
        "is_stale": state.last_seen_at < stale_cutoff,
        "last_checkpoint_id": state.last_checkpoint_id,
        "last_checkpoint_code": state.last_checkpoint.code if state.last_checkpoint else "",
        "last_checkpoint_name": state.last_checkpoint.name if state.last_checkpoint else "",
        "last_checkpoint_at": state.last_checkpoint_at.isoformat() if state.last_checkpoint_at else None,
    }


def _serialize_patrol_record_scan(record: PatrolRecord) -> dict:
    return {
        "id": record.id,
        "occurred_at": record.occurred_at.isoformat(),
        "guard_id": record.guard_id,
        "guard_name": str(record.guard) if record.guard else record.guard_identifier,
        "checkpoint_id": record.checkpoint_id,
        "checkpoint_name": record.checkpoint.name if record.checkpoint else record.checkpoint_identifier,
        "checkpoint_code": record.checkpoint.code if record.checkpoint else record.checkpoint_identifier,
        "device_number": record.device_number,
        "source": record.source,
        "record_type": record.record_type,
        "latitude": str(record.latitude) if record.latitude is not None else None,
        "longitude": str(record.longitude) if record.longitude is not None else None,
    }


def _serialize_checkpoint(checkpoint: Checkpoint, *, recently_scanned: bool) -> dict:
    return {
        "id": checkpoint.id,
        "site_id": checkpoint.site_id,
        "site_name": checkpoint.site.name,
        "code": checkpoint.code,
        "name": checkpoint.name,
        "kind": checkpoint.kind,
        "latitude": str(checkpoint.latitude) if checkpoint.latitude is not None else None,
        "longitude": str(checkpoint.longitude) if checkpoint.longitude is not None else None,
        "recently_scanned": recently_scanned,
    }


def update_guard_live_state(record: PatrolRecord) -> GuardLiveState | None:
    if not record.device_id:
        return None

    device = record.device
    site_id = device.site_id if device else None
    if record.checkpoint_id and record.checkpoint:
        site_id = record.checkpoint.site_id

    defaults = {
        "guard": record.guard,
        "site_id": site_id,
        "last_seen_at": record.occurred_at,
        "last_record_type": record.record_type or "",
        "last_patrol_record": record,
    }

    if record.latitude is not None and record.longitude is not None:
        defaults["latitude"] = record.latitude
        defaults["longitude"] = record.longitude
        defaults["speed"] = record.speed
        defaults["satellites"] = record.satellites

    if _is_checkpoint_scan(record):
        defaults["last_checkpoint"] = record.checkpoint
        defaults["last_checkpoint_at"] = record.occurred_at

    assignment = _resolve_assignment(
        {
            "occurred_at": record.occurred_at,
            "guard_id": record.guard_id,
            "route_id": record.route_id,
        },
        record.guard,
        record.route,
        device,
    )
    if assignment:
        defaults["assignment"] = assignment

    live_state, _ = GuardLiveState.objects.update_or_create(device_id=record.device_id, defaults=defaults)
    return live_state


def build_live_monitoring_snapshot(*, site_id=None):
    stale_seconds = getattr(settings, "LIVE_MONITORING_STALE_SECONDS", 900)
    recent_scan_limit = getattr(settings, "LIVE_MONITORING_RECENT_SCAN_LIMIT", 30)
    recent_scan_hours = getattr(settings, "LIVE_MONITORING_RECENT_SCAN_HOURS", 24)
    scan_highlight_seconds = getattr(settings, "LIVE_MONITORING_SCAN_HIGHLIGHT_SECONDS", 3600)

    now = timezone.now()
    stale_cutoff = now - timedelta(seconds=stale_seconds)
    recent_cutoff = now - timedelta(hours=recent_scan_hours)
    highlight_cutoff = now - timedelta(seconds=scan_highlight_seconds)

    live_states = GuardLiveState.objects.select_related(
        "device",
        "guard",
        "site",
        "last_checkpoint",
        "assignment",
        "assignment__shift",
    )
    if site_id:
        live_states = live_states.filter(site_id=site_id)

    guards = []
    for state in live_states.order_by("-last_seen_at"):
        guards.append(_serialize_guard_live_state(state, stale_cutoff=stale_cutoff))

    recent_records = PatrolRecord.objects.filter(occurred_at__gte=recent_cutoff).select_related(
        "guard",
        "checkpoint",
        "device",
        "route",
    )
    if site_id:
        recent_records = recent_records.filter(
            Q(checkpoint__site_id=site_id)
            | Q(device__site_id=site_id)
            | Q(route__site_id=site_id)
        )
    recent_records = recent_records.order_by("-occurred_at")[:recent_scan_limit]

    recent_scans = []
    highlighted_checkpoint_ids = set()
    for record in recent_records:
        if record.checkpoint_id and record.occurred_at >= highlight_cutoff:
            highlighted_checkpoint_ids.add(record.checkpoint_id)
        recent_scans.append(_serialize_patrol_record_scan(record))

    checkpoint_qs = Checkpoint.objects.filter(is_active=True).select_related("site")
    if site_id:
        checkpoint_qs = checkpoint_qs.filter(site_id=site_id)
    checkpoints = []
    for checkpoint in checkpoint_qs.order_by("site__name", "name"):
        checkpoints.append(
            _serialize_checkpoint(checkpoint, recently_scanned=checkpoint.id in highlighted_checkpoint_ids)
        )

    return {
        "generated_at": now.isoformat(),
        "stale_after_seconds": stale_seconds,
        "site_id": int(site_id) if site_id else None,
        "guards": guards,
        "recent_scans": recent_scans,
        "checkpoints": checkpoints,
    }


def build_live_update_payload(record: PatrolRecord) -> dict:
    stale_seconds = getattr(settings, "LIVE_MONITORING_STALE_SECONDS", 900)
    stale_cutoff = timezone.now() - timedelta(seconds=stale_seconds)
    site_ids = _record_site_ids(record)

    live_state = None
    if record.device_id:
        live_state = (
            GuardLiveState.objects.select_related(
                "device",
                "guard",
                "site",
                "last_checkpoint",
                "last_patrol_record",
            )
            .filter(device_id=record.device_id)
            .first()
        )

    checkpoint_update = None
    if record.checkpoint_id and record.checkpoint:
        checkpoint_update = _serialize_checkpoint(record.checkpoint, recently_scanned=True)

    return {
        "type": "live_update",
        "generated_at": timezone.now().isoformat(),
        "site_ids": site_ids,
        "scan": _serialize_patrol_record_scan(record),
        "guard": _serialize_guard_live_state(live_state, stale_cutoff=stale_cutoff) if live_state else None,
        "checkpoint": checkpoint_update,
    }


def publish_live_monitoring_update(record_id: int) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    try:
        record = PatrolRecord.objects.select_related(
            "guard", "checkpoint", "checkpoint__site", "device", "route"
        ).get(id=record_id)
    except PatrolRecord.DoesNotExist:
        return

    payload = build_live_update_payload(record)

    async def _broadcast():
        await channel_layer.group_send(
            "live_monitoring",
            {"type": "live_update", "payload": payload},
        )
        for site_id in payload["site_ids"]:
            await channel_layer.group_send(
                f"live_monitoring_site_{site_id}",
                {"type": "live_update", "payload": payload},
            )

    async_to_sync(_broadcast)()
