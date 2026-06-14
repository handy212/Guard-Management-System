from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class
from apps.patrols.services import evaluate_assignment_patrol

from .models import AttendanceRecord, GuardAssignment, Shift
from .serializers import AttendanceRecordSerializer, GuardAssignmentSerializer, ShiftSerializer


class ShiftViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Shift.objects.select_related("site")
    serializer_class = ShiftSerializer
    permission_classes = [permission_class("shifts.manage")]


class GuardAssignmentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = GuardAssignment.objects.select_related("guard", "shift", "shift__site", "supervisor", "patrol_route", "patrol_device")
    serializer_class = GuardAssignmentSerializer
    permission_classes = [permission_class("shifts.manage")]

    @action(detail=True, methods=["post"], url_path="evaluate-patrol")
    def evaluate_patrol(self, request, pk=None):
        assignment = self.get_object()
        grace_minutes = int(request.data.get("grace_minutes", 15))
        return Response(evaluate_assignment_patrol(assignment, grace_minutes=grace_minutes))

    @action(detail=True, methods=["post"], url_path="confirm-deployment")
    def confirm_deployment(self, request, pk=None):
        assignment = self.get_object()
        assignment.status = GuardAssignment.Status.CONFIRMED
        assignment.deployment_confirmed_at = timezone.now()
        assignment.save(update_fields=["status", "deployment_confirmed_at", "updated_at"])
        return Response({"assignment": assignment.id, "status": assignment.status, "deployment_confirmed_at": assignment.deployment_confirmed_at.isoformat()})

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        assignment = self.get_object()
        checked_in_at = self._parse_action_datetime(request.data.get("checked_in_at"), "checked_in_at")
        attendance = self._get_or_init_attendance(assignment)
        serializer = AttendanceRecordSerializer(
            attendance,
            data={
                "assignment": assignment.id,
                "checked_in_at": checked_in_at,
                "source": request.data.get("source", attendance.source or AttendanceRecord.Source.MANUAL),
                "notes": request.data.get("notes", attendance.notes),
            },
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        attendance = serializer.save()
        return Response({"assignment": assignment.id, "attendance_id": attendance.id, "checked_in_at": attendance.checked_in_at.isoformat()})

    @action(detail=True, methods=["post"], url_path="check-out")
    def check_out(self, request, pk=None):
        assignment = self.get_object()
        checked_out_at = self._parse_action_datetime(request.data.get("checked_out_at"), "checked_out_at")
        attendance = self._get_or_init_attendance(assignment)
        serializer = AttendanceRecordSerializer(
            attendance,
            data={
                "assignment": assignment.id,
                "checked_out_at": checked_out_at,
                "source": request.data.get("source", attendance.source or AttendanceRecord.Source.MANUAL),
                "notes": request.data.get("notes", attendance.notes),
            },
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        attendance = serializer.save()
        assignment.status = GuardAssignment.Status.COMPLETED
        assignment.save(update_fields=["status", "updated_at"])
        return Response(
            {
                "assignment": assignment.id,
                "attendance_id": attendance.id,
                "checked_out_at": attendance.checked_out_at.isoformat(),
                "patrol_evaluation": evaluate_assignment_patrol(assignment),
            }
        )

    @staticmethod
    def _parse_action_datetime(value, field_name):
        if not value:
            return timezone.now()
        parsed = parse_datetime(value)
        if parsed is None:
            raise serializers.ValidationError({field_name: "Enter a valid ISO 8601 datetime."})
        return parsed

    @staticmethod
    def _get_or_init_attendance(assignment):
        attendance = AttendanceRecord.objects.filter(assignment=assignment).order_by("id").first()
        if attendance:
            return attendance
        return AttendanceRecord(assignment=assignment)


class AttendanceRecordViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related("assignment", "assignment__guard", "assignment__shift")
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permission_class("shifts.manage")]
