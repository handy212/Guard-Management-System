import csv
import json
from io import StringIO

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.mixins import AuditLogMixin
from apps.core.permissions import permission_class

from .models import ReportRequest
from .serializers import ReportRequestSerializer
from .services import generate_report_summary


class ReportRequestViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = ReportRequest.objects.select_related("requested_by", "client", "site")
    serializer_class = ReportRequestSerializer
    permission_classes = [permission_class("reports.view")]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if getattr(user, "client_id", None):
            return queryset.filter(client_id=user.client_id)
        return queryset

    @action(detail=True, methods=["post"], url_path="generate")
    def generate(self, request, pk=None):
        report_request = self.get_object()
        summary = generate_report_summary(report_request)
        return Response({"report_request": report_request.id, "status": report_request.status, "summary": summary})

    @action(detail=True, methods=["get"], url_path="export")
    def export(self, request, pk=None):
        report_request = self.get_object()
        summary = report_request.parameters.get("summary") or generate_report_summary(report_request)
        export_format = request.query_params.get("format", "csv")

        if export_format == "json":
            response = HttpResponse(
                json.dumps(summary, indent=2),
                content_type="application/json",
            )
            response["Content-Disposition"] = f'attachment; filename="report-{report_request.id}.json"'
            return response

        csv_buffer = StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(["report_type", summary["report_type"]])
        writer.writerow([])
        writer.writerow(["metric", "value"])
        for key, value in summary["totals"].items():
            writer.writerow([key, value])
        writer.writerow([])
        writer.writerow(["site_id", "site_name", "assignment_count", "incident_count", "complaint_count"])
        for row in summary["site_breakdown"]:
            writer.writerow(
                [
                    row.get("id"),
                    row.get("name"),
                    row.get("assignment_count"),
                    row.get("incident_count"),
                    row.get("complaint_count"),
                ]
            )

        response = HttpResponse(csv_buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="report-{report_request.id}.csv"'
        return response
