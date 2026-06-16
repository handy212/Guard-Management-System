from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class
from apps.device_integration.services import configure_patrol_device_network, sync_patrol_device

from .models import PatrolDevice
from .serializers import (
    PatrolDeviceNetworkConfigSerializer,
    PatrolDeviceSerializer,
    PatrolDeviceSyncSerializer,
)


class PatrolDeviceViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = PatrolDevice.objects.select_related("site")
    serializer_class = PatrolDeviceSerializer
    permission_classes = [permission_class("patrols.manage")]

    @action(detail=True, methods=["post"], url_path="sync")
    def sync(self, request, pk=None):
        device = self.get_object()
        serializer = PatrolDeviceSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = sync_patrol_device(
            device,
            clear_device_after_sync=serializer.validated_data["clear_device_after_sync"],
        )
        self.audit_action(
            "sync",
            device,
            extra_metadata={
                "clear_device_after_sync": serializer.validated_data["clear_device_after_sync"],
                "imported_count": result.get("import", {}).get("imported_count"),
            },
        )
        return Response(result, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=["post"], url_path="sync-placeholder")
    def sync_placeholder(self, request, pk=None):
        return self.sync(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="configure-network")
    def configure_network(self, request, pk=None):
        device = self.get_object()
        serializer = PatrolDeviceNetworkConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = configure_patrol_device_network(device, validated_data=serializer.validated_data)
        self.audit_action(
            "configure_network",
            device,
            extra_metadata={"network_mode": serializer.validated_data.get("network_mode")},
        )
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="configure-network-placeholder")
    def configure_network_placeholder(self, request, pk=None):
        return self.configure_network(request, pk=pk)
