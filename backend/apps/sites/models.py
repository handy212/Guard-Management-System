from django.db import models

from apps.core.models import TimeStampedModel


class Site(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    client = models.ForeignKey("clients.Client", on_delete=models.CASCADE, related_name="sites")
    name = models.CharField(max_length=200)
    code = models.SlugField()
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    contact_name = models.CharField(max_length=160, blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    required_guards = models.PositiveIntegerField(default=0)
    shift_requirements = models.TextField(blank=True)
    patrol_requirements = models.TextField(blank=True)

    class Meta:
        ordering = ["client__name", "name"]
        constraints = [
            models.UniqueConstraint(fields=["client", "code"], name="unique_site_code_per_client"),
        ]

    def __str__(self) -> str:
        return f"{self.client.name} - {self.name}"


class SiteEmergencyContact(TimeStampedModel):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="emergency_contacts")
    name = models.CharField(max_length=160)
    role = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=40)
    email = models.EmailField(blank=True)
    priority = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["site__name", "priority", "name"]


class SiteInstruction(TimeStampedModel):
    class Category(models.TextChoices):
        POST_ORDER = "post_order", "Post Order"
        EMERGENCY = "emergency", "Emergency"
        PATROL = "patrol", "Patrol"
        ACCESS_CONTROL = "access_control", "Access Control"
        OTHER = "other", "Other"

    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="instructions")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.POST_ORDER)
    body = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["site__name", "title"]
