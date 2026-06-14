from rest_framework import viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class

from .models import ClientComplaint, IncidentReport, SupervisorInspection
from .serializers import ClientComplaintSerializer, IncidentReportSerializer, SupervisorInspectionSerializer


class IncidentReportViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = IncidentReport.objects.select_related("site", "guard", "reported_by")
    serializer_class = IncidentReportSerializer
    permission_classes = [permission_class("incidents.manage")]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class SupervisorInspectionViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = SupervisorInspection.objects.select_related("site", "supervisor")
    serializer_class = SupervisorInspectionSerializer
    permission_classes = [permission_class("incidents.manage")]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class ClientComplaintViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = ClientComplaint.objects.select_related("client", "site", "submitted_by")
    serializer_class = ClientComplaintSerializer
    permission_classes = [permission_class("incidents.manage", read_permission="reports.view")]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if getattr(user, "client_id", None):
            return queryset.filter(client_id=user.client_id)
        return queryset
