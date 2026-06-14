from django.db import models

from apps.core.models import TimeStampedModel


class PatrolDevice(TimeStampedModel):
    class ConnectionMode(models.TextChoices):
        USB = "usb", "USB"
        TCP = "tcp", "TCP/GPRS"

    class Status(models.TextChoices):
        REGISTERED = "registered", "Registered"
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        MAINTENANCE = "maintenance", "Maintenance"

    site = models.ForeignKey("sites.Site", null=True, blank=True, on_delete=models.SET_NULL, related_name="devices")
    name = models.CharField(max_length=160)
    device_number = models.CharField(max_length=80, unique=True)
    imei = models.CharField(max_length=80, blank=True, db_index=True)
    serial_number = models.CharField(max_length=120, blank=True)
    connection_mode = models.CharField(max_length=20, choices=ConnectionMode.choices, default=ConnectionMode.USB)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REGISTERED)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sdk_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.device_number})"
