import secrets

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.devices.models import PatrolDevice
from apps.patrols.models import PatrolRecord
from apps.patrols.serializers import PatrolRecordImportSerializer
from apps.patrols.services import import_patrol_records


class PatrolRecordIngestPermission:
    def has_permission(self, request, view):
        expected = getattr(settings, "PATROL_INGEST_API_TOKEN", "")
        if not expected:
            return False
        authorization = request.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()
        return secrets.compare_digest(token, expected)


class PatrolRecordIngestView(APIView):
    """Internal endpoint for the Windows GPRS/TCP listener service."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        expected = getattr(settings, "PATROL_INGEST_API_TOKEN", "")
        if not expected:
            return Response(
                {"detail": "PATROL_INGEST_API_TOKEN is not configured on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not PatrolRecordIngestPermission().has_permission(request, self):
            return Response({"detail": "Invalid or missing ingest token."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PatrolRecordImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = None
        device_id = serializer.validated_data.get("device_id")
        if device_id:
            device = PatrolDevice.objects.filter(id=device_id).first()
            if device is None:
                raise ValidationError({"device_id": "Patrol device not found."})

        source = serializer.validated_data.get("source") or PatrolRecord.Source.TCP
        result = import_patrol_records(
            serializer.validated_data["records"],
            default_source=source,
            default_device=device,
        )
        return Response({"status": "completed", **result}, status=status.HTTP_201_CREATED)
