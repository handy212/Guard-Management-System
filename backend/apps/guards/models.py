from django.db import models

from apps.core.models import TimeStampedModel


class GuardProfile(TimeStampedModel):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        ASSIGNED = "assigned", "Assigned"
        ON_DUTY = "on_duty", "On Duty"
        OFF_DUTY = "off_duty", "Off Duty"
        ON_LEAVE = "on_leave", "On Leave"
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        TERMINATED = "terminated", "Terminated"

    user = models.OneToOneField("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="guard_profile")
    employee_number = models.CharField(max_length=80, unique=True)
    card_number = models.CharField(max_length=80, blank=True, db_index=True)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    national_id_number = models.CharField(max_length=120, blank=True)
    license_number = models.CharField(max_length=120, blank=True)
    assigned_site = models.ForeignKey("sites.Site", null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_guards")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    hired_on = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"


class GuardNextOfKin(TimeStampedModel):
    guard = models.ForeignKey(GuardProfile, on_delete=models.CASCADE, related_name="next_of_kin")
    name = models.CharField(max_length=160)
    relationship = models.CharField(max_length=80)
    phone = models.CharField(max_length=40)
    address = models.TextField(blank=True)
    is_primary = models.BooleanField(default=True)

    class Meta:
        ordering = ["guard__last_name", "name"]


class GuardDocument(TimeStampedModel):
    class DocumentType(models.TextChoices):
        NATIONAL_ID = "national_id", "National ID"
        LICENSE = "license", "License"
        CERTIFICATION = "certification", "Certification"
        TRAINING = "training", "Training"
        OTHER = "other", "Other"

    guard = models.ForeignKey(GuardProfile, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    reference_number = models.CharField(max_length=120, blank=True)
    issued_on = models.DateField(null=True, blank=True)
    expires_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["guard__last_name", "document_type"]


class GuardTrainingRecord(TimeStampedModel):
    guard = models.ForeignKey(GuardProfile, on_delete=models.CASCADE, related_name="training_records")
    title = models.CharField(max_length=160)
    provider = models.CharField(max_length=160, blank=True)
    completed_on = models.DateField(null=True, blank=True)
    expires_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["guard__last_name", "-completed_on"]


class UniformIssue(TimeStampedModel):
    guard = models.ForeignKey(GuardProfile, on_delete=models.CASCADE, related_name="uniform_issues")
    item = models.CharField(max_length=160)
    quantity = models.PositiveIntegerField(default=1)
    issued_on = models.DateField()
    returned_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["guard__last_name", "-issued_on"]


class DisciplinaryRecord(TimeStampedModel):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    guard = models.ForeignKey(GuardProfile, on_delete=models.CASCADE, related_name="disciplinary_records")
    title = models.CharField(max_length=160)
    description = models.TextField()
    action_taken = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.LOW)
    occurred_on = models.DateField()

    class Meta:
        ordering = ["guard__last_name", "-occurred_on"]
