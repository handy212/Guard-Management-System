from rest_framework import viewsets

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class

from .models import DisciplinaryRecord, GuardDocument, GuardNextOfKin, GuardProfile, GuardTrainingRecord, UniformIssue
from .serializers import (
    DisciplinaryRecordSerializer,
    GuardDocumentSerializer,
    GuardNextOfKinSerializer,
    GuardProfileSerializer,
    GuardTrainingRecordSerializer,
    UniformIssueSerializer,
)


class GuardProfileViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = GuardProfile.objects.select_related("user")
    serializer_class = GuardProfileSerializer
    permission_classes = [permission_class("guards.manage")]


class GuardNextOfKinViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = GuardNextOfKin.objects.select_related("guard")
    serializer_class = GuardNextOfKinSerializer
    permission_classes = [permission_class("guards.manage")]


class GuardDocumentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = GuardDocument.objects.select_related("guard")
    serializer_class = GuardDocumentSerializer
    permission_classes = [permission_class("guards.manage")]


class GuardTrainingRecordViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = GuardTrainingRecord.objects.select_related("guard")
    serializer_class = GuardTrainingRecordSerializer
    permission_classes = [permission_class("guards.manage")]


class UniformIssueViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = UniformIssue.objects.select_related("guard")
    serializer_class = UniformIssueSerializer
    permission_classes = [permission_class("guards.manage")]


class DisciplinaryRecordViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = DisciplinaryRecord.objects.select_related("guard")
    serializer_class = DisciplinaryRecordSerializer
    permission_classes = [permission_class("guards.manage")]
