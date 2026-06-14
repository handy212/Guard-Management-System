from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from apps.accounts.views import AuthLoginView, AuthLogoutView, AuthMeView, PermissionViewSet, RoleViewSet, UserViewSet
from apps.audits.views import AuditLogViewSet
from apps.clients.views import ClientContactViewSet, ClientContractViewSet, ClientViewSet
from apps.companies.views import BranchViewSet, CompanySettingsViewSet, DepartmentViewSet
from apps.dashboard.views import (
    ClientPortalComplaintCreateView,
    ClientPortalOverviewView,
    ClientPortalReportRequestCreateView,
    ClientPortalSummaryView,
    DashboardSummaryView,
    OperationsOverviewView,
)
from apps.devices.views import PatrolDeviceViewSet
from apps.guards.views import (
    DisciplinaryRecordViewSet,
    GuardDocumentViewSet,
    GuardNextOfKinViewSet,
    GuardProfileViewSet,
    GuardTrainingRecordViewSet,
    UniformIssueViewSet,
)
from apps.incidents.views import ClientComplaintViewSet, IncidentReportViewSet, SupervisorInspectionViewSet
from apps.patrols.views import (
    CheckpointViewSet,
    PatrolExceptionViewSet,
    PatrolRecordViewSet,
    PatrolRouteCheckpointViewSet,
    PatrolRouteViewSet,
)
from apps.shifts.views import AttendanceRecordViewSet, GuardAssignmentViewSet, ShiftViewSet
from apps.reports.views import ReportRequestViewSet
from apps.sites.views import SiteEmergencyContactViewSet, SiteInstructionViewSet, SiteViewSet

router = DefaultRouter()
router.register("roles", RoleViewSet)
router.register("permissions", PermissionViewSet)
router.register("users", UserViewSet)
router.register("company-settings", CompanySettingsViewSet)
router.register("branches", BranchViewSet)
router.register("departments", DepartmentViewSet)
router.register("clients", ClientViewSet)
router.register("client-contacts", ClientContactViewSet)
router.register("client-contracts", ClientContractViewSet)
router.register("sites", SiteViewSet)
router.register("site-emergency-contacts", SiteEmergencyContactViewSet)
router.register("site-instructions", SiteInstructionViewSet)
router.register("guards", GuardProfileViewSet)
router.register("guard-next-of-kin", GuardNextOfKinViewSet)
router.register("guard-documents", GuardDocumentViewSet)
router.register("guard-training-records", GuardTrainingRecordViewSet)
router.register("uniform-issues", UniformIssueViewSet)
router.register("disciplinary-records", DisciplinaryRecordViewSet)
router.register("shifts", ShiftViewSet)
router.register("assignments", GuardAssignmentViewSet)
router.register("attendance", AttendanceRecordViewSet)
router.register("devices", PatrolDeviceViewSet)
router.register("checkpoints", CheckpointViewSet)
router.register("patrol-routes", PatrolRouteViewSet)
router.register("patrol-route-checkpoints", PatrolRouteCheckpointViewSet)
router.register("patrol-records", PatrolRecordViewSet)
router.register("patrol-exceptions", PatrolExceptionViewSet)
router.register("incidents", IncidentReportViewSet)
router.register("supervisor-inspections", SupervisorInspectionViewSet)
router.register("client-complaints", ClientComplaintViewSet)
router.register("report-requests", ReportRequestViewSet)
router.register("audit-logs", AuditLogViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(router.urls)),
    path("api/v1/auth/login/", AuthLoginView.as_view(), name="auth-login"),
    path("api/v1/auth/logout/", AuthLogoutView.as_view(), name="auth-logout"),
    path("api/v1/auth/me/", AuthMeView.as_view(), name="auth-me"),
    path("api/v1/dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("api/v1/dashboard/operations/", OperationsOverviewView.as_view(), name="dashboard-operations"),
    path("api/v1/client-portal/summary/", ClientPortalSummaryView.as_view(), name="client-portal-summary"),
    path("api/v1/client-portal/overview/", ClientPortalOverviewView.as_view(), name="client-portal-overview"),
    path("api/v1/client-portal/complaints/", ClientPortalComplaintCreateView.as_view(), name="client-portal-complaints"),
    path("api/v1/client-portal/report-requests/", ClientPortalReportRequestCreateView.as_view(), name="client-portal-report-requests"),
    path("api/v1/health/", include("apps.core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
