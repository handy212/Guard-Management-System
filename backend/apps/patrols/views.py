from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class
from apps.devices.models import PatrolDevice

from .models import Checkpoint, PatrolException, PatrolRecord, PatrolRoute, PatrolRouteCheckpoint
from .serializers import (
    CheckpointSerializer,
    PatrolExceptionSerializer,
    PatrolRecordImportSerializer,
    PatrolRecordSerializer,
    PatrolRouteCheckpointSerializer,
    PatrolRouteSerializer,
)
from .services import import_patrol_records


class CheckpointViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Checkpoint.objects.select_related("site")
    serializer_class = CheckpointSerializer
    permission_classes = [permission_class("patrols.manage")]


class PatrolRouteViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = PatrolRoute.objects.select_related("site")
    serializer_class = PatrolRouteSerializer
    permission_classes = [permission_class("patrols.manage")]


class PatrolRouteCheckpointViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = PatrolRouteCheckpoint.objects.select_related("route", "checkpoint")
    serializer_class = PatrolRouteCheckpointSerializer
    permission_classes = [permission_class("patrols.manage")]


class PatrolRecordViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = PatrolRecord.objects.select_related("device", "guard", "checkpoint", "route")
    serializer_class = PatrolRecordSerializer
    permission_classes = [permission_class("patrols.manage", read_permission="reports.view")]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if getattr(user, "client_id", None):
            return queryset.filter(route__site__client_id=user.client_id)
        return queryset

    @action(detail=False, methods=["post"], url_path="import-placeholder")
    def import_placeholder(self, request):
        serializer = PatrolRecordImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = None
        if serializer.validated_data.get("device_id"):
            device = PatrolDevice.objects.get(id=serializer.validated_data["device_id"])
        result = import_patrol_records(
            serializer.validated_data["records"],
            default_source=serializer.validated_data["source"],
            default_device=device,
        )
        if device:
            self.audit_action(
                "import_records",
                device,
                extra_metadata={
                    "imported_count": result.get("imported_count"),
                    "duplicate_count": result.get("duplicate_count"),
                },
            )
        return Response({"status": "completed", **result}, status=status.HTTP_201_CREATED)


class PatrolExceptionViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = PatrolException.objects.select_related("assignment", "route", "checkpoint")
    serializer_class = PatrolExceptionSerializer
    permission_classes = [permission_class("patrols.manage", read_permission="reports.view")]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if getattr(user, "client_id", None):
            return queryset.filter(assignment__shift__site__client_id=user.client_id)
        return queryset
