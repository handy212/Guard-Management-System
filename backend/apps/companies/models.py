from django.db import models

from apps.core.models import TimeStampedModel


class CompanySettings(TimeStampedModel):
    name = models.CharField(max_length=200)
    legal_name = models.CharField(max_length=240, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    timezone = models.CharField(max_length=80, default="UTC")
    address = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "company settings"

    def __str__(self) -> str:
        return self.name


class Branch(TimeStampedModel):
    name = models.CharField(max_length=160)
    code = models.SlugField(unique=True)
    region = models.CharField(max_length=120, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Department(TimeStampedModel):
    branch = models.ForeignKey(Branch, null=True, blank=True, on_delete=models.SET_NULL, related_name="departments")
    name = models.CharField(max_length=160)
    code = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
