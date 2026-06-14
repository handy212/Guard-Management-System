from django.db import models

from apps.core.models import TimeStampedModel


class Checkpoint(TimeStampedModel):
    class Kind(models.TextChoices):
        RFID = "rfid", "RFID"
        GPS = "gps", "GPS"

    site = models.ForeignKey("sites.Site", on_delete=models.CASCADE, related_name="checkpoints")
    name = models.CharField(max_length=160)
    code = models.CharField(max_length=80, db_index=True)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.RFID)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    radius_meters = models.PositiveIntegerField(default=0)
    event_codes = models.CharField(max_length=200, default="0")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["site__name", "name"]
        constraints = [
            models.UniqueConstraint(fields=["site", "code"], name="unique_checkpoint_code_per_site"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class PatrolRoute(TimeStampedModel):
    site = models.ForeignKey("sites.Site", on_delete=models.CASCADE, related_name="patrol_routes")
    name = models.CharField(max_length=160)
    code = models.SlugField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["site__name", "name"]
        constraints = [
            models.UniqueConstraint(fields=["site", "code"], name="unique_route_code_per_site"),
        ]

    def __str__(self) -> str:
        return self.name


class PatrolRouteCheckpoint(TimeStampedModel):
    route = models.ForeignKey(PatrolRoute, on_delete=models.CASCADE, related_name="route_checkpoints")
    checkpoint = models.ForeignKey(Checkpoint, on_delete=models.CASCADE, related_name="route_steps")
    sequence = models.PositiveIntegerField()
    expected_offset_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["route", "sequence"]
        constraints = [
            models.UniqueConstraint(fields=["route", "sequence"], name="unique_route_checkpoint_sequence"),
            models.UniqueConstraint(fields=["route", "checkpoint"], name="unique_checkpoint_per_route"),
        ]


class PatrolRecord(TimeStampedModel):
    class Source(models.TextChoices):
        USB = "usb", "USB"
        TCP = "tcp", "TCP/GPRS"
        MANUAL_IMPORT = "manual_import", "Manual Import"

    device = models.ForeignKey("devices.PatrolDevice", null=True, blank=True, on_delete=models.SET_NULL, related_name="patrol_records")
    guard = models.ForeignKey("guards.GuardProfile", null=True, blank=True, on_delete=models.SET_NULL, related_name="patrol_records")
    checkpoint = models.ForeignKey(Checkpoint, null=True, blank=True, on_delete=models.SET_NULL, related_name="patrol_records")
    route = models.ForeignKey(PatrolRoute, null=True, blank=True, on_delete=models.SET_NULL, related_name="patrol_records")
    source = models.CharField(max_length=20, choices=Source.choices)
    source_record_id = models.CharField(max_length=160, blank=True, db_index=True)
    device_number = models.CharField(max_length=80, blank=True, db_index=True)
    imei = models.CharField(max_length=80, blank=True, db_index=True)
    guard_identifier = models.CharField(max_length=80, blank=True, db_index=True)
    checkpoint_identifier = models.CharField(max_length=80, blank=True, db_index=True)
    record_type = models.CharField(max_length=80, blank=True)
    occurred_at = models.DateTimeField()
    information = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    speed = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    satellites = models.PositiveIntegerField(null=True, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-occurred_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["source", "device_number", "source_record_id"],
                name="unique_source_device_record",
            ),
        ]


class PatrolException(TimeStampedModel):
    class ExceptionType(models.TextChoices):
        MISSED_CHECKPOINT = "missed_checkpoint", "Missed Checkpoint"
        LATE_CHECKPOINT = "late_checkpoint", "Late Checkpoint"
        WRONG_SEQUENCE = "wrong_sequence", "Wrong Sequence"
        DEVICE_NOT_SYNCED = "device_not_synced", "Device Not Synced"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        RESOLVED = "resolved", "Resolved"

    assignment = models.ForeignKey("shifts.GuardAssignment", on_delete=models.CASCADE, related_name="patrol_exceptions")
    route = models.ForeignKey(PatrolRoute, null=True, blank=True, on_delete=models.SET_NULL, related_name="patrol_exceptions")
    checkpoint = models.ForeignKey(Checkpoint, null=True, blank=True, on_delete=models.SET_NULL, related_name="patrol_exceptions")
    exception_type = models.CharField(max_length=40, choices=ExceptionType.choices)
    expected_at = models.DateTimeField(null=True, blank=True)
    actual_at = models.DateTimeField(null=True, blank=True)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["assignment", "checkpoint", "exception_type"],
                name="unique_patrol_exception_per_assignment_checkpoint_type",
            ),
        ]
