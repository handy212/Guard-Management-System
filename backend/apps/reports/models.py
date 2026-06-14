from django.db import models

from apps.core.models import TimeStampedModel


class ReportRequest(TimeStampedModel):
    class ReportType(models.TextChoices):
        DAILY_ATTENDANCE = "daily_attendance", "Daily Attendance"
        DUTY_ROSTER = "duty_roster", "Duty Roster"
        PATROL_COMPLETION = "patrol_completion", "Patrol Completion"
        MISSED_CHECKPOINT = "missed_checkpoint", "Missed Checkpoint"
        INCIDENT = "incident", "Incident"
        SUPERVISOR_INSPECTION = "supervisor_inspection", "Supervisor Inspection"
        CLIENT_SERVICE = "client_service", "Client Service"
        DEVICE_USAGE = "device_usage", "Device Usage"
        GUARD_PERFORMANCE = "guard_performance", "Guard Performance"
        SITE_PERFORMANCE = "site_performance", "Site Performance"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    requested_by = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="report_requests")
    client = models.ForeignKey("clients.Client", null=True, blank=True, on_delete=models.SET_NULL, related_name="report_requests")
    site = models.ForeignKey("sites.Site", null=True, blank=True, on_delete=models.SET_NULL, related_name="report_requests")
    report_type = models.CharField(max_length=40, choices=ReportType.choices)
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    file_url = models.URLField(blank=True)
    parameters = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
