from django.db import models

from apps.core.models import TimeStampedModel


class Client(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    name = models.CharField(max_length=200)
    code = models.SlugField(unique=True)
    contact_name = models.CharField(max_length=160, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    billing_address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class ClientContact(TimeStampedModel):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=160)
    title = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    is_primary = models.BooleanField(default=False)
    can_access_portal = models.BooleanField(default=False)

    class Meta:
        ordering = ["client__name", "name"]

    def __str__(self) -> str:
        return f"{self.client.name} - {self.name}"


class ClientContract(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        TERMINATED = "terminated", "Terminated"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="contracts")
    contract_number = models.CharField(max_length=120, unique=True)
    title = models.CharField(max_length=200)
    starts_on = models.DateField()
    ends_on = models.DateField(null=True, blank=True)
    billing_terms = models.TextField(blank=True)
    service_level_agreement = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    class Meta:
        ordering = ["-starts_on"]

    def __str__(self) -> str:
        return self.contract_number
