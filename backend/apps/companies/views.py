from rest_framework import viewsets

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class

from .models import Branch, CompanySettings, Department
from .serializers import BranchSerializer, CompanySettingsSerializer, DepartmentSerializer


class CompanySettingsViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = CompanySettings.objects.all()
    serializer_class = CompanySettingsSerializer
    permission_classes = [permission_class("settings.manage")]


class BranchViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permission_class("settings.manage")]


class DepartmentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Department.objects.select_related("branch")
    serializer_class = DepartmentSerializer
    permission_classes = [permission_class("settings.manage")]
