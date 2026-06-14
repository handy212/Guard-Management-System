from datetime import timedelta
from decimal import Decimal

from django.db import IntegrityError

from apps.devices.models import PatrolDevice
from apps.guards.models import GuardProfile
from apps.shifts.models import GuardAssignment

from .models import Checkpoint, PatrolException, PatrolRecord, PatrolRoute


def evaluate_assignment_patrol(assignment: GuardAssignment, grace_minutes: int = 15) -> dict:
    route = assignment.patrol_route
    shift = assignment.shift
    if not route:
        return {"status": "not_configured", "message": "Assignment has no patrol route.", "results": [], "exceptions": []}

    route_steps = list(route.route_checkpoints.select_related("checkpoint").order_by("sequence"))
    records = list(
        PatrolRecord.objects.filter(
            route=route,
            guard=assignment.guard,
            occurred_at__gte=shift.starts_at,
            occurred_at__lte=shift.ends_at,
        )
        .select_related("checkpoint")
        .order_by("occurred_at")
    )
    records_by_checkpoint = {}
    for record in records:
        if record.checkpoint_id and record.checkpoint_id not in records_by_checkpoint:
            records_by_checkpoint[record.checkpoint_id] = record

    results = []
    exceptions = []
    touched_exception_keys = set()
    previous_actual_at = None
    for step in route_steps:
        expected_at = shift.starts_at + timedelta(minutes=step.expected_offset_minutes)
        latest_allowed_at = expected_at + timedelta(minutes=grace_minutes)
        record = records_by_checkpoint.get(step.checkpoint_id)
        result = {
            "checkpoint_id": step.checkpoint_id,
            "checkpoint_name": step.checkpoint.name,
            "sequence": step.sequence,
            "expected_at": expected_at.isoformat(),
            "actual_at": record.occurred_at.isoformat() if record else None,
            "status": "completed",
        }

        if not record:
            result["status"] = "missed_checkpoint"
            touched_exception_keys.add((step.checkpoint_id, PatrolException.ExceptionType.MISSED_CHECKPOINT))
            exceptions.append(
                _upsert_exception(
                    assignment,
                    route,
                    step.checkpoint,
                    PatrolException.ExceptionType.MISSED_CHECKPOINT,
                    expected_at,
                    None,
                    "Checkpoint was not recorded during the assigned shift.",
                )
            )
        elif record.occurred_at > latest_allowed_at:
            result["status"] = "late_checkpoint"
            touched_exception_keys.add((step.checkpoint_id, PatrolException.ExceptionType.LATE_CHECKPOINT))
            exceptions.append(
                _upsert_exception(
                    assignment,
                    route,
                    step.checkpoint,
                    PatrolException.ExceptionType.LATE_CHECKPOINT,
                    expected_at,
                    record.occurred_at,
                    f"Checkpoint was recorded more than {grace_minutes} minutes after expected time.",
                )
            )

        if record and previous_actual_at and record.occurred_at < previous_actual_at:
            result["status"] = "wrong_sequence"
            touched_exception_keys.add((step.checkpoint_id, PatrolException.ExceptionType.WRONG_SEQUENCE))
            exceptions.append(
                _upsert_exception(
                    assignment,
                    route,
                    step.checkpoint,
                    PatrolException.ExceptionType.WRONG_SEQUENCE,
                    expected_at,
                    record.occurred_at,
                    "Checkpoint was recorded out of route order.",
                )
            )
        if record:
            previous_actual_at = record.occurred_at
        results.append(result)

    _close_stale_open_exceptions(assignment, touched_exception_keys)

    overall_status = "completed" if all(result["status"] == "completed" for result in results) else "exceptions"
    return {
        "status": overall_status,
        "route": {"id": route.id, "name": route.name},
        "assignment": assignment.id,
        "results": results,
        "exceptions": [exception.id for exception in exceptions],
    }


def import_patrol_records(records, default_source=PatrolRecord.Source.MANUAL_IMPORT, default_device=None):
    imported_records = []
    duplicate_count = 0
    affected_assignments = set()

    for item in records:
        device = _resolve_device(item, default_device)
        guard = _resolve_guard(item)
        checkpoint = _resolve_checkpoint(item, device)
        route = _resolve_route(item, checkpoint, device)
        assignment = _resolve_assignment(item, guard, route, device)

        payload = {
            "source": item.get("source") or default_source,
            "source_record_id": item.get("source_record_id", ""),
            "device": device,
            "guard": guard,
            "checkpoint": checkpoint,
            "route": route,
            "device_number": item.get("device_number") or (device.device_number if device else ""),
            "imei": item.get("imei") or (device.imei if device else ""),
            "guard_identifier": item.get("guard_identifier") or item.get("guard_employee_number") or item.get("guard_card_number", ""),
            "checkpoint_identifier": item.get("checkpoint_identifier") or item.get("checkpoint_code") or (checkpoint.code if checkpoint else ""),
            "record_type": item.get("record_type", ""),
            "occurred_at": item["occurred_at"],
            "information": item.get("information", ""),
            "latitude": item.get("latitude"),
            "longitude": item.get("longitude"),
            "speed": item.get("speed"),
            "satellites": item.get("satellites"),
            "raw_payload": _normalize_raw_payload(item.get("raw_payload") or _build_raw_payload(item)),
        }

        lookup = {
            "source": payload["source"],
            "device_number": payload["device_number"],
            "source_record_id": payload["source_record_id"],
        }
        defaults = payload.copy()
        defaults.pop("source")
        defaults.pop("device_number")
        defaults.pop("source_record_id")

        record, created = PatrolRecord.objects.get_or_create(
            **lookup,
            defaults=defaults,
        )
        if created:
            imported_records.append(record)
        else:
            duplicate_count += 1

        if assignment:
            affected_assignments.add(assignment.id)

    evaluation_results = [
        evaluate_assignment_patrol(
            GuardAssignment.objects.select_related("guard", "shift", "patrol_route").get(id=assignment_id)
        )
        for assignment_id in sorted(affected_assignments)
    ]

    return {
        "imported_count": len(imported_records),
        "duplicate_count": duplicate_count,
        "record_ids": [record.id for record in imported_records],
        "evaluated_assignments": evaluation_results,
    }


def _resolve_device(item, default_device):
    if item.get("device_id"):
        return PatrolDevice.objects.get(id=item["device_id"])
    if item.get("device_number"):
        return PatrolDevice.objects.filter(device_number=item["device_number"]).first()
    return default_device


def _resolve_guard(item):
    if item.get("guard_id"):
        return GuardProfile.objects.get(id=item["guard_id"])
    if item.get("guard_employee_number"):
        return GuardProfile.objects.filter(employee_number=item["guard_employee_number"]).first()
    if item.get("guard_card_number"):
        return GuardProfile.objects.filter(card_number=item["guard_card_number"]).first()
    return None


def _resolve_checkpoint(item, device):
    if item.get("checkpoint_id"):
        return Checkpoint.objects.get(id=item["checkpoint_id"])
    if item.get("checkpoint_code"):
        checkpoint_qs = Checkpoint.objects.filter(code=item["checkpoint_code"])
        if device and device.site_id:
            checkpoint_qs = checkpoint_qs.filter(site_id=device.site_id)
        return checkpoint_qs.order_by("id").first()
    return None


def _resolve_route(item, checkpoint, device):
    if item.get("route_id"):
        return PatrolRoute.objects.get(id=item["route_id"])
    if item.get("route_code"):
        route_qs = PatrolRoute.objects.filter(code=item["route_code"])
        if checkpoint:
            route_qs = route_qs.filter(site_id=checkpoint.site_id)
        elif device and device.site_id:
            route_qs = route_qs.filter(site_id=device.site_id)
        return route_qs.order_by("id").first()
    if checkpoint:
        return PatrolRoute.objects.filter(site_id=checkpoint.site_id, route_checkpoints__checkpoint=checkpoint).distinct().order_by("id").first()
    return None


def _resolve_assignment(item, guard, route, device):
    if item.get("assignment_id"):
        return GuardAssignment.objects.filter(id=item["assignment_id"]).first()
    if not guard:
        return None

    assignment_qs = GuardAssignment.objects.filter(
        guard=guard,
        shift__starts_at__lte=item["occurred_at"],
        shift__ends_at__gte=item["occurred_at"],
    )
    if route:
        assignment_qs = assignment_qs.filter(patrol_route=route)
    elif device:
        assignment_qs = assignment_qs.filter(patrol_device=device)

    return assignment_qs.select_related("shift", "patrol_route").order_by("shift__starts_at").first()


def _upsert_exception(assignment, route, checkpoint, exception_type, expected_at, actual_at, details):
    try:
        exception, _ = PatrolException.objects.update_or_create(
            assignment=assignment,
            checkpoint=checkpoint,
            exception_type=exception_type,
            defaults={
                "route": route,
                "expected_at": expected_at,
                "actual_at": actual_at,
                "details": details,
                "status": PatrolException.Status.OPEN,
            },
        )
        return exception
    except IntegrityError:
        return PatrolException.objects.get(assignment=assignment, checkpoint=checkpoint, exception_type=exception_type)


def _close_stale_open_exceptions(assignment, touched_exception_keys):
    open_exceptions = PatrolException.objects.filter(assignment=assignment, status=PatrolException.Status.OPEN).select_related("checkpoint")
    for exception in open_exceptions:
        checkpoint_id = exception.checkpoint_id
        key = (checkpoint_id, exception.exception_type)
        if key not in touched_exception_keys:
            exception.status = PatrolException.Status.RESOLVED
            exception.save(update_fields=["status", "updated_at"])


def _json_safe_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {key: _json_safe_value(nested) for key, nested in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe_value(nested) for nested in value]
    return value


def _normalize_raw_payload(raw_payload):
    if not isinstance(raw_payload, dict):
        return {}
    return {key: _json_safe_value(value) for key, value in raw_payload.items()}


def _build_raw_payload(item):
    return _normalize_raw_payload(item)
