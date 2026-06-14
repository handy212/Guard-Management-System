from django.db.models import Count, F, Q

from apps.incidents.models import ClientComplaint, IncidentReport, SupervisorInspection
from apps.patrols.models import PatrolException, PatrolRecord
from apps.shifts.models import AttendanceRecord, GuardAssignment, Shift
from apps.sites.models import Site

from .models import ReportRequest


def generate_report_summary(report_request: ReportRequest) -> dict:
    site_filter = Q()
    if report_request.site_id:
        site_filter &= Q(id=report_request.site_id)
    elif report_request.client_id:
        site_filter &= Q(client_id=report_request.client_id)

    shift_filter = Q()
    assignment_filter = Q()
    patrol_record_filter = Q()
    incident_filter = Q()
    inspection_filter = Q()
    complaint_filter = Q()
    exception_filter = Q()
    attendance_filter = Q()

    if report_request.site_id:
        shift_filter &= Q(site_id=report_request.site_id)
        assignment_filter &= Q(shift__site_id=report_request.site_id)
        patrol_record_filter &= Q(route__site_id=report_request.site_id)
        incident_filter &= Q(site_id=report_request.site_id)
        inspection_filter &= Q(site_id=report_request.site_id)
        complaint_filter &= Q(site_id=report_request.site_id)
        exception_filter &= Q(assignment__shift__site_id=report_request.site_id)
        attendance_filter &= Q(assignment__shift__site_id=report_request.site_id)
    elif report_request.client_id:
        shift_filter &= Q(site__client_id=report_request.client_id)
        assignment_filter &= Q(shift__site__client_id=report_request.client_id)
        patrol_record_filter &= Q(route__site__client_id=report_request.client_id)
        incident_filter &= Q(site__client_id=report_request.client_id)
        inspection_filter &= Q(site__client_id=report_request.client_id)
        complaint_filter &= Q(client_id=report_request.client_id)
        exception_filter &= Q(assignment__shift__site__client_id=report_request.client_id)
        attendance_filter &= Q(assignment__shift__site__client_id=report_request.client_id)

    if report_request.date_from:
        shift_filter &= Q(starts_at__date__gte=report_request.date_from)
        assignment_filter &= Q(shift__starts_at__date__gte=report_request.date_from)
        patrol_record_filter &= Q(occurred_at__date__gte=report_request.date_from)
        incident_filter &= Q(occurred_at__date__gte=report_request.date_from)
        inspection_filter &= Q(inspected_at__date__gte=report_request.date_from)
        complaint_filter &= Q(created_at__date__gte=report_request.date_from)
        exception_filter &= Q(created_at__date__gte=report_request.date_from)
        attendance_filter &= Q(created_at__date__gte=report_request.date_from)

    if report_request.date_to:
        shift_filter &= Q(starts_at__date__lte=report_request.date_to)
        assignment_filter &= Q(shift__starts_at__date__lte=report_request.date_to)
        patrol_record_filter &= Q(occurred_at__date__lte=report_request.date_to)
        incident_filter &= Q(occurred_at__date__lte=report_request.date_to)
        inspection_filter &= Q(inspected_at__date__lte=report_request.date_to)
        complaint_filter &= Q(created_at__date__lte=report_request.date_to)
        exception_filter &= Q(created_at__date__lte=report_request.date_to)
        attendance_filter &= Q(created_at__date__lte=report_request.date_to)

    scoped_sites = Site.objects.filter(site_filter) if site_filter else Site.objects.all()
    scoped_shifts = Shift.objects.filter(shift_filter)
    scoped_assignments = GuardAssignment.objects.filter(assignment_filter)
    scoped_patrol_records = PatrolRecord.objects.filter(patrol_record_filter)
    scoped_incidents = IncidentReport.objects.filter(incident_filter)
    scoped_inspections = SupervisorInspection.objects.filter(inspection_filter)
    scoped_complaints = ClientComplaint.objects.filter(complaint_filter)
    scoped_exceptions = PatrolException.objects.filter(exception_filter)
    scoped_attendance = AttendanceRecord.objects.filter(attendance_filter)

    late_attendance = scoped_attendance.filter(
        checked_in_at__isnull=False,
        checked_in_at__gt=F("assignment__shift__starts_at"),
    )

    site_assignment_filter = Q()
    site_incident_filter = Q()
    site_complaint_filter = Q()
    if report_request.date_from:
        site_assignment_filter &= Q(shifts__starts_at__date__gte=report_request.date_from)
        site_incident_filter &= Q(incidents__occurred_at__date__gte=report_request.date_from)
        site_complaint_filter &= Q(client_complaints__created_at__date__gte=report_request.date_from)
    if report_request.date_to:
        site_assignment_filter &= Q(shifts__starts_at__date__lte=report_request.date_to)
        site_incident_filter &= Q(incidents__occurred_at__date__lte=report_request.date_to)
        site_complaint_filter &= Q(client_complaints__created_at__date__lte=report_request.date_to)

    summary = {
        "report_type": report_request.report_type,
        "scope": {
            "client_id": report_request.client_id,
            "site_id": report_request.site_id,
            "date_from": report_request.date_from.isoformat() if report_request.date_from else None,
            "date_to": report_request.date_to.isoformat() if report_request.date_to else None,
        },
        "totals": {
            "sites": scoped_sites.count(),
            "shifts": scoped_shifts.count(),
            "assignments": scoped_assignments.count(),
            "attendance_records": scoped_attendance.count(),
            "late_attendance": late_attendance.count(),
            "patrol_records": scoped_patrol_records.count(),
            "open_patrol_exceptions": scoped_exceptions.filter(status=PatrolException.Status.OPEN).count(),
            "incidents": scoped_incidents.count(),
            "open_incidents": scoped_incidents.filter(
                status__in=[IncidentReport.Status.OPEN, IncidentReport.Status.INVESTIGATING]
            ).count(),
            "supervisor_inspections": scoped_inspections.count(),
            "complaints": scoped_complaints.count(),
        },
        "site_breakdown": list(
            scoped_sites.annotate(
                assignment_count=Count("shifts__assignments", filter=site_assignment_filter, distinct=True),
                incident_count=Count("incidents", filter=site_incident_filter, distinct=True),
                complaint_count=Count("client_complaints", filter=site_complaint_filter, distinct=True),
            )
            .values("id", "name", "assignment_count", "incident_count", "complaint_count")[:10]
        ),
    }

    report_request.parameters = {**report_request.parameters, "summary": summary}
    report_request.status = ReportRequest.Status.COMPLETED
    report_request.save(update_fields=["parameters", "status", "updated_at"])
    return summary
