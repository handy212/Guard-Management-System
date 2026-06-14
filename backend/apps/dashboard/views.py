from django.db.models import Count, F, Max, Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import InternalOnlyPermission
from apps.clients.models import Client
from apps.devices.models import PatrolDevice
from apps.guards.models import GuardProfile
from apps.incidents.models import ClientComplaint, IncidentReport, SupervisorInspection
from apps.incidents.serializers import ClientComplaintSerializer
from apps.patrols.models import Checkpoint, PatrolException, PatrolRecord, PatrolRoute
from apps.reports.models import ReportRequest
from apps.reports.serializers import ReportRequestSerializer
from apps.reports.services import generate_report_summary
from apps.shifts.models import AttendanceRecord, GuardAssignment, Shift
from apps.sites.models import Site


def _format_assignment_card(assignment: GuardAssignment, now):
    attendance = assignment.attendance_records.order_by("-checked_in_at", "-created_at").first()
    open_exception_count = assignment.patrol_exceptions.filter(status=PatrolException.Status.OPEN).count()
    patrol_record_count = PatrolRecord.objects.filter(
        route=assignment.patrol_route,
        guard=assignment.guard,
        occurred_at__gte=assignment.shift.starts_at,
        occurred_at__lte=assignment.shift.ends_at,
    ).count()

    if attendance and attendance.checked_out_at:
        attendance_status = "checked_out"
    elif attendance and attendance.checked_in_at:
        attendance_status = "checked_in"
    elif assignment.shift.starts_at <= now:
        attendance_status = "awaiting_attendance"
    else:
        attendance_status = "scheduled"

    if not assignment.patrol_route:
        patrol_status = "route_missing"
    elif open_exception_count:
        patrol_status = "exceptions"
    elif patrol_record_count:
        patrol_status = "records_synced"
    elif assignment.shift.starts_at <= now:
        patrol_status = "awaiting_sync"
    else:
        patrol_status = "scheduled"

    return {
        "id": assignment.id,
        "client_name": assignment.shift.site.client.name,
        "site_name": assignment.shift.site.name,
        "guard_name": str(assignment.guard),
        "shift_name": assignment.shift.name,
        "shift_starts_at": assignment.shift.starts_at.isoformat(),
        "shift_ends_at": assignment.shift.ends_at.isoformat(),
        "assignment_status": assignment.status,
        "attendance_status": attendance_status,
        "patrol_status": patrol_status,
        "route_name": assignment.patrol_route.name if assignment.patrol_route else None,
        "device_name": assignment.patrol_device.name if assignment.patrol_device else None,
        "supervisor_name": str(assignment.supervisor) if assignment.supervisor else None,
        "open_exception_count": open_exception_count,
        "patrol_record_count": patrol_record_count,
    }


def _scoped_client_or_403(user):
    client = getattr(user, "client", None)
    if not client:
        raise PermissionDenied("This user is not linked to a client portal account.")
    return client


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, InternalOnlyPermission]

    def get(self, request):
        return Response(
            {
                "clients": Client.objects.count(),
                "sites": Site.objects.count(),
                "guards": GuardProfile.objects.count(),
                "shifts": Shift.objects.count(),
                "assignments": GuardAssignment.objects.count(),
                "devices": PatrolDevice.objects.count(),
                "checkpoints": Checkpoint.objects.count(),
                "patrol_routes": PatrolRoute.objects.count(),
                "patrol_records": PatrolRecord.objects.count(),
                "open_incidents": IncidentReport.objects.filter(status=IncidentReport.Status.OPEN).count(),
            }
        )


class OperationsOverviewView(APIView):
    permission_classes = [IsAuthenticated, InternalOnlyPermission]

    def get(self, request):
        now = timezone.now()
        today = timezone.localdate()

        todays_assignments = GuardAssignment.objects.filter(shift__starts_at__date=today)
        checked_in_assignments = todays_assignments.filter(attendance_records__checked_in_at__isnull=False).distinct()

        late_attendance = AttendanceRecord.objects.filter(
            assignment__shift__starts_at__date=today,
            checked_in_at__isnull=False,
            checked_in_at__gt=F("assignment__shift__starts_at"),
        )

        active_assignments = (
            GuardAssignment.objects.select_related(
                "guard",
                "supervisor",
                "shift",
                "shift__site",
                "shift__site__client",
                "patrol_route",
                "patrol_device",
            )
            .prefetch_related("attendance_records", "patrol_exceptions")
            .order_by("shift__starts_at")[:8]
        )

        open_exception_qs = (
            PatrolException.objects.filter(status=PatrolException.Status.OPEN)
            .select_related("assignment", "assignment__guard", "route", "checkpoint", "assignment__shift", "assignment__shift__site")
            .order_by("-created_at")[:8]
        )
        incident_qs = (
            IncidentReport.objects.filter(status__in=[IncidentReport.Status.OPEN, IncidentReport.Status.INVESTIGATING])
            .select_related("site", "site__client", "guard")
            .order_by("-occurred_at")[:8]
        )
        inspection_qs = (
            SupervisorInspection.objects.select_related("site", "site__client", "supervisor")
            .order_by("-inspected_at")[:8]
        )

        site_summaries = (
            Site.objects.filter(status=Site.Status.ACTIVE)
            .annotate(
                route_count=Count("patrol_routes", distinct=True),
                device_count=Count("devices", distinct=True),
                assignment_count=Count("shifts__assignments", distinct=True),
                open_incident_count=Count(
                    "incidents",
                    filter=Q(incidents__status__in=[IncidentReport.Status.OPEN, IncidentReport.Status.INVESTIGATING]),
                    distinct=True,
                ),
                open_exception_count=Count(
                    "shifts__assignments__patrol_exceptions",
                    filter=Q(shifts__assignments__patrol_exceptions__status=PatrolException.Status.OPEN),
                    distinct=True,
                ),
                last_inspected_at=Max("supervisor_inspections__inspected_at"),
            )
            .select_related("client")
            .order_by("client__name", "name")[:6]
        )

        return Response(
            {
                "flow": {
                    "clients": Client.objects.count(),
                    "sites": Site.objects.count(),
                    "guards": GuardProfile.objects.count(),
                    "devices": PatrolDevice.objects.count(),
                    "checkpoints": Checkpoint.objects.count(),
                    "patrol_routes": PatrolRoute.objects.count(),
                    "assignments": GuardAssignment.objects.count(),
                    "patrol_records": PatrolRecord.objects.count(),
                    "reports": ReportRequest.objects.count(),
                },
                "metrics": {
                    "guards_on_duty": checked_in_assignments.count(),
                    "absent_guards": max(todays_assignments.count() - checked_in_assignments.count(), 0),
                    "late_guards": late_attendance.count(),
                    "active_sites": Site.objects.filter(status=Site.Status.ACTIVE).count(),
                    "missed_patrols": PatrolException.objects.filter(status=PatrolException.Status.OPEN).count(),
                    "open_incidents": IncidentReport.objects.filter(
                        status__in=[IncidentReport.Status.OPEN, IncidentReport.Status.INVESTIGATING]
                    ).count(),
                    "faulty_devices": PatrolDevice.objects.filter(
                        status__in=[PatrolDevice.Status.INACTIVE, PatrolDevice.Status.MAINTENANCE]
                    ).count(),
                    "pending_supervisor_reviews": SupervisorInspection.objects.filter(
                        status__in=[SupervisorInspection.Status.DRAFT, SupervisorInspection.Status.SUBMITTED]
                    ).count(),
                },
                "assignment_board": [_format_assignment_card(assignment, now) for assignment in active_assignments],
                "site_performance": [
                    {
                        "id": site.id,
                        "client_name": site.client.name,
                        "site_name": site.name,
                        "required_guards": site.required_guards,
                        "assigned_guards": site.assignment_count,
                        "route_count": site.route_count,
                        "device_count": site.device_count,
                        "open_incident_count": site.open_incident_count,
                        "open_exception_count": site.open_exception_count,
                        "last_inspected_at": site.last_inspected_at.isoformat() if site.last_inspected_at else None,
                    }
                    for site in site_summaries
                ],
                "patrol_exceptions": [
                    {
                        "id": exception.id,
                        "site_name": exception.assignment.shift.site.name,
                        "guard_name": str(exception.assignment.guard),
                        "checkpoint_name": exception.checkpoint.name if exception.checkpoint else None,
                        "exception_type": exception.exception_type,
                        "status": exception.status,
                        "expected_at": exception.expected_at.isoformat() if exception.expected_at else None,
                    }
                    for exception in open_exception_qs
                ],
                "incidents": [
                    {
                        "id": incident.id,
                        "site_name": incident.site.name,
                        "client_name": incident.site.client.name,
                        "title": incident.title,
                        "severity": incident.severity,
                        "status": incident.status,
                        "occurred_at": incident.occurred_at.isoformat(),
                    }
                    for incident in incident_qs
                ],
                "supervisor_reviews": [
                    {
                        "id": inspection.id,
                        "site_name": inspection.site.name,
                        "supervisor_name": str(inspection.supervisor) if inspection.supervisor else None,
                        "status": inspection.status,
                        "inspected_at": inspection.inspected_at.isoformat(),
                        "attendance_confirmed": inspection.attendance_confirmed,
                        "patrol_device_ok": inspection.patrol_device_ok,
                    }
                    for inspection in inspection_qs
                ],
            }
        )


class ClientPortalSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = _scoped_client_or_403(request.user)
        site_ids = Site.objects.filter(client=client).values_list("id", flat=True)
        shift_ids = Shift.objects.filter(site_id__in=site_ids).values_list("id", flat=True)
        route_ids = PatrolRoute.objects.filter(site_id__in=site_ids).values_list("id", flat=True)

        return Response(
            {
                "client": {"id": client.id, "name": client.name, "code": client.code},
                "sites": Site.objects.filter(id__in=site_ids).count(),
                "scheduled_shifts": Shift.objects.filter(id__in=shift_ids).count(),
                "assignments": GuardAssignment.objects.filter(shift_id__in=shift_ids).count(),
                "devices": PatrolDevice.objects.filter(site_id__in=site_ids).count(),
                "checkpoints": Checkpoint.objects.filter(site_id__in=site_ids).count(),
                "patrol_routes": PatrolRoute.objects.filter(id__in=route_ids).count(),
                "patrol_records": PatrolRecord.objects.filter(route_id__in=route_ids).count(),
                "open_incidents": IncidentReport.objects.filter(
                    site_id__in=site_ids,
                    status__in=[IncidentReport.Status.OPEN, IncidentReport.Status.INVESTIGATING],
                ).count(),
            }
        )


class ClientPortalOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = _scoped_client_or_403(request.user)
        site_qs = (
            Site.objects.filter(client=client)
            .annotate(
                route_count=Count("patrol_routes", distinct=True),
                device_count=Count("devices", distinct=True),
                assignment_count=Count("shifts__assignments", distinct=True),
                open_incident_count=Count(
                    "incidents",
                    filter=Q(incidents__status__in=[IncidentReport.Status.OPEN, IncidentReport.Status.INVESTIGATING]),
                    distinct=True,
                ),
                last_patrol_record_at=Max("patrol_routes__patrol_records__occurred_at"),
                last_inspected_at=Max("supervisor_inspections__inspected_at"),
            )
            .order_by("name")
        )

        site_ids = list(site_qs.values_list("id", flat=True))
        assignment_qs = (
            GuardAssignment.objects.filter(shift__site_id__in=site_ids)
            .select_related("guard", "shift", "shift__site", "patrol_route", "patrol_device")
            .prefetch_related("attendance_records", "patrol_exceptions")
            .order_by("-shift__starts_at")[:8]
        )
        incident_qs = (
            IncidentReport.objects.filter(site_id__in=site_ids)
            .select_related("site", "guard")
            .order_by("-occurred_at")[:8]
        )
        inspection_qs = (
            SupervisorInspection.objects.filter(site_id__in=site_ids)
            .select_related("site", "supervisor")
            .order_by("-inspected_at")[:8]
        )
        exception_qs = (
            PatrolException.objects.filter(assignment__shift__site_id__in=site_ids)
            .select_related("assignment", "assignment__guard", "assignment__shift", "assignment__shift__site", "checkpoint")
            .order_by("-created_at")[:8]
        )
        complaint_qs = ClientComplaint.objects.filter(client=client).select_related("site").order_by("-created_at")[:8]
        report_qs = ReportRequest.objects.filter(client=client).select_related("site").order_by("-created_at")[:8]

        return Response(
            {
                "client": {"id": client.id, "name": client.name, "code": client.code},
                "metrics": {
                    "sites": site_qs.count(),
                    "scheduled_shifts": Shift.objects.filter(site__client=client).count(),
                    "assignments": GuardAssignment.objects.filter(shift__site__client=client).count(),
                    "patrol_records": PatrolRecord.objects.filter(route__site__client=client).count(),
                    "open_incidents": IncidentReport.objects.filter(
                        site__client=client,
                        status__in=[IncidentReport.Status.OPEN, IncidentReport.Status.INVESTIGATING],
                    ).count(),
                    "open_complaints": ClientComplaint.objects.filter(
                        client=client,
                        status__in=[ClientComplaint.Status.OPEN, ClientComplaint.Status.INVESTIGATING],
                    ).count(),
                },
                "sites": [
                    {
                        "id": site.id,
                        "name": site.name,
                        "address": site.address,
                        "required_guards": site.required_guards,
                        "assigned_guards": site.assignment_count,
                        "route_count": site.route_count,
                        "device_count": site.device_count,
                        "open_incident_count": site.open_incident_count,
                        "last_patrol_record_at": site.last_patrol_record_at.isoformat() if site.last_patrol_record_at else None,
                        "last_inspected_at": site.last_inspected_at.isoformat() if site.last_inspected_at else None,
                    }
                    for site in site_qs
                ],
                "attendance_and_deployments": [
                    _format_assignment_card(assignment, timezone.now()) for assignment in assignment_qs
                ],
                "patrol_exceptions": [
                    {
                        "id": exception.id,
                        "site_name": exception.assignment.shift.site.name,
                        "guard_name": str(exception.assignment.guard),
                        "checkpoint_name": exception.checkpoint.name if exception.checkpoint else None,
                        "exception_type": exception.exception_type,
                        "status": exception.status,
                        "expected_at": exception.expected_at.isoformat() if exception.expected_at else None,
                    }
                    for exception in exception_qs
                ],
                "incidents": [
                    {
                        "id": incident.id,
                        "site_name": incident.site.name,
                        "title": incident.title,
                        "severity": incident.severity,
                        "status": incident.status,
                        "occurred_at": incident.occurred_at.isoformat(),
                    }
                    for incident in incident_qs
                ],
                "supervisor_inspections": [
                    {
                        "id": inspection.id,
                        "site_name": inspection.site.name,
                        "status": inspection.status,
                        "inspected_at": inspection.inspected_at.isoformat(),
                        "remarks": inspection.remarks,
                    }
                    for inspection in inspection_qs
                ],
                "complaints": [
                    {
                        "id": complaint.id,
                        "site_name": complaint.site.name if complaint.site else None,
                        "title": complaint.title,
                        "status": complaint.status,
                        "created_at": complaint.created_at.isoformat(),
                    }
                    for complaint in complaint_qs
                ],
                "reports": [
                    {
                        "id": report.id,
                        "site_name": report.site.name if report.site else None,
                        "report_type": report.report_type,
                        "status": report.status,
                        "created_at": report.created_at.isoformat(),
                        "summary": report.parameters.get("summary"),
                    }
                    for report in report_qs
                ],
            }
        )


class ClientPortalComplaintCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        client = _scoped_client_or_403(request.user)
        payload = request.data.copy()
        payload["client"] = client.id
        serializer = ClientComplaintSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()
        return Response(ClientComplaintSerializer(complaint).data, status=201)


class ClientPortalReportRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        client = _scoped_client_or_403(request.user)
        payload = request.data.copy()
        payload["client"] = client.id
        serializer = ReportRequestSerializer(data=payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        report_request = serializer.save()
        summary = generate_report_summary(report_request)
        return Response(
            {
                **ReportRequestSerializer(report_request).data,
                "summary": summary,
            },
            status=201,
        )
