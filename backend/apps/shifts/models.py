from django.db import models

from apps.core.models import TimeStampedModel


class Shift(TimeStampedModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    site = models.ForeignKey("sites.Site", on_delete=models.CASCADE, related_name="shifts")
    name = models.CharField(max_length=160)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)

    class Meta:
        ordering = ["-starts_at"]

    def __str__(self) -> str:
        return f"{self.name} @ {self.site.name}"


class GuardAssignment(TimeStampedModel):
    class Status(models.TextChoices):
        ASSIGNED = "assigned", "Assigned"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        MISSED = "missed", "Missed"

    guard = models.ForeignKey("guards.GuardProfile", on_delete=models.CASCADE, related_name="assignments")
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name="assignments")
    supervisor = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="supervised_assignments")
    patrol_route = models.ForeignKey("patrols.PatrolRoute", null=True, blank=True, on_delete=models.SET_NULL, related_name="assignments")
    patrol_device = models.ForeignKey("devices.PatrolDevice", null=True, blank=True, on_delete=models.SET_NULL, related_name="assignments")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ASSIGNED)
    deployment_confirmed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-shift__starts_at"]
        constraints = [
            models.UniqueConstraint(fields=["guard", "shift"], name="unique_guard_shift_assignment"),
        ]


class AttendanceRecord(TimeStampedModel):
    class Source(models.TextChoices):
        MANUAL = "manual", "Manual"
        DEVICE = "device", "Device"

    assignment = models.ForeignKey(GuardAssignment, on_delete=models.CASCADE, related_name="attendance_records")
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.MANUAL)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-checked_in_at", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["assignment"], name="unique_attendance_per_assignment"),
        ]
