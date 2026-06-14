from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class IncidentReport(TimeStampedModel):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        INVESTIGATING = "investigating", "Investigating"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    site = models.ForeignKey("sites.Site", on_delete=models.CASCADE, related_name="incidents")
    guard = models.ForeignKey("guards.GuardProfile", null=True, blank=True, on_delete=models.SET_NULL, related_name="incidents")
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reported_incidents")
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    occurred_at = models.DateTimeField()
    resolved_at = models.DateTimeField(null=True, blank=True)
    attachment = models.FileField(upload_to="incident_attachments/", null=True, blank=True)

    class Meta:
        ordering = ["-occurred_at"]


class SupervisorInspection(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        REVIEWED = "reviewed", "Reviewed"

    site = models.ForeignKey("sites.Site", on_delete=models.CASCADE, related_name="supervisor_inspections")
    supervisor = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="supervisor_inspections")
    inspected_at = models.DateTimeField()
    guard_appearance_ok = models.BooleanField(default=True)
    post_order_compliance_ok = models.BooleanField(default=True)
    patrol_device_ok = models.BooleanField(default=True)
    attendance_confirmed = models.BooleanField(default=True)
    client_feedback = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    attachment = models.FileField(upload_to="inspection_attachments/", null=True, blank=True)

    class Meta:
        ordering = ["-inspected_at"]


class ClientComplaint(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        INVESTIGATING = "investigating", "Investigating"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    client = models.ForeignKey("clients.Client", on_delete=models.CASCADE, related_name="complaints")
    site = models.ForeignKey("sites.Site", null=True, blank=True, on_delete=models.SET_NULL, related_name="client_complaints")
    submitted_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="client_complaints")
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
