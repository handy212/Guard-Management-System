from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Permission, Role
from apps.clients.models import Client, ClientContact, ClientContract
from apps.companies.models import Branch, CompanySettings, Department
from apps.devices.models import PatrolDevice
from apps.guards.models import GuardNextOfKin, GuardProfile, GuardTrainingRecord, UniformIssue
from apps.incidents.models import ClientComplaint, IncidentReport, SupervisorInspection
from apps.patrols.models import Checkpoint, PatrolRecord, PatrolRoute, PatrolRouteCheckpoint
from apps.patrols.services import evaluate_assignment_patrol
from apps.reports.models import ReportRequest
from apps.shifts.models import AttendanceRecord, GuardAssignment, Shift
from apps.sites.models import Site, SiteEmergencyContact, SiteInstruction


class Command(BaseCommand):
    help = "Seed sample data for local development."

    def handle(self, *args, **options):
        permission_codes = [
            "clients.view",
            "clients.manage",
            "sites.manage",
            "guards.manage",
            "shifts.manage",
            "patrols.manage",
            "incidents.manage",
            "reports.view",
            "settings.manage",
        ]
        permissions = {
            code: Permission.objects.get_or_create(code=code, defaults={"name": code.replace(".", " ").title()})[0]
            for code in permission_codes
        }
        admin_role, _ = Role.objects.get_or_create(code="admin", defaults={"name": "Administrator"})
        admin_role.permissions.set(permissions.values())
        supervisor_role, _ = Role.objects.get_or_create(code="supervisor", defaults={"name": "Supervisor"})
        supervisor_role.permissions.set([permissions["sites.manage"], permissions["guards.manage"], permissions["patrols.manage"], permissions["incidents.manage"]])
        client_role, _ = Role.objects.get_or_create(code="client", defaults={"name": "Client Portal User"})
        client_role.permissions.set([permissions["reports.view"]])

        CompanySettings.objects.get_or_create(
            name="Demo Security Company",
            defaults={"email": "operations@example.test", "phone": "+1-555-0100", "timezone": "UTC"},
        )
        branch, _ = Branch.objects.get_or_create(
            code="accra",
            defaults={"name": "Accra Operations Branch", "region": "Greater Accra", "phone": "+233-555-0100"},
        )
        Department.objects.get_or_create(branch=branch, code="operations", defaults={"name": "Operations"})
        Department.objects.get_or_create(branch=branch, code="control-room", defaults={"name": "Control Room"})

        client, _ = Client.objects.get_or_create(
            code="acme",
            defaults={"name": "ACME Distribution", "contact_name": "Jordan Client", "contact_email": "client@example.test"},
        )
        ClientContact.objects.get_or_create(
            client=client,
            email="client@example.test",
            defaults={"name": "Jordan Client", "title": "Facilities Manager", "phone": "+233-555-0200", "is_primary": True, "can_access_portal": True},
        )
        ClientContract.objects.get_or_create(
            contract_number="ACME-SEC-2026",
            defaults={
                "client": client,
                "title": "Warehouse Guarding Contract",
                "starts_on": timezone.localdate(),
                "billing_terms": "Monthly billing for day and night guarding services.",
                "service_level_agreement": "Daily attendance and patrol completion report required.",
                "status": ClientContract.Status.ACTIVE,
            },
        )
        site, _ = Site.objects.get_or_create(
            client=client,
            code="main-warehouse",
            defaults={"name": "Main Warehouse", "address": "100 Industrial Way", "required_guards": 4, "shift_requirements": "Day and night coverage", "patrol_requirements": "Perimeter route every 60 minutes"},
        )
        second_site, _ = Site.objects.get_or_create(
            client=client,
            code="annex-yard",
            defaults={"name": "Annex Yard", "address": "102 Industrial Way", "required_guards": 2, "shift_requirements": "Night only", "patrol_requirements": "Fence patrol every 30 minutes"},
        )
        SiteEmergencyContact.objects.get_or_create(site=site, phone="+233-555-0300", defaults={"name": "Warehouse Control", "role": "Emergency Desk"})
        SiteInstruction.objects.get_or_create(
            site=site,
            title="Main Gate Post Order",
            defaults={"body": "Verify all vehicle access and record visitor movements.", "category": SiteInstruction.Category.POST_ORDER},
        )
        SiteEmergencyContact.objects.get_or_create(site=second_site, phone="+233-555-0311", defaults={"name": "Annex Control", "role": "Emergency Desk"})
        SiteInstruction.objects.get_or_create(
            site=second_site,
            title="Annex Yard Post Order",
            defaults={"body": "Verify fence line and loading access points every round.", "category": SiteInstruction.Category.POST_ORDER},
        )

        User = get_user_model()
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.test", "first_name": "System", "last_name": "Admin", "role": admin_role, "is_staff": True, "is_superuser": True},
        )
        admin_user.role = admin_role
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save(update_fields=["role", "is_staff", "is_superuser"])
        if created:
            admin_user.set_password("ChangeMe123!")
            admin_user.save()

        client_user, client_user_created = User.objects.get_or_create(
            username="client",
            defaults={"email": "client@example.test", "first_name": "Jordan", "last_name": "Client", "role": client_role, "client": client},
        )
        client_user.role = client_role
        client_user.client = client
        client_user.save(update_fields=["role", "client"])
        if client_user_created:
            client_user.set_password("ClientPass123!")
            client_user.save()

        guard, _ = GuardProfile.objects.get_or_create(
            employee_number="G-1001",
            defaults={"first_name": "Alex", "last_name": "Guard", "card_number": "00AFCD1A", "phone": "+1-555-0110", "assigned_site": site, "status": GuardProfile.Status.ASSIGNED},
        )
        second_guard, _ = GuardProfile.objects.get_or_create(
            employee_number="G-1002",
            defaults={"first_name": "Morgan", "last_name": "Patrol", "card_number": "00AFCD2B", "phone": "+1-555-0111", "assigned_site": second_site, "status": GuardProfile.Status.ASSIGNED},
        )
        GuardNextOfKin.objects.get_or_create(guard=guard, phone="+233-555-0400", defaults={"name": "Taylor Guard", "relationship": "Sibling"})
        GuardTrainingRecord.objects.get_or_create(guard=guard, title="Basic Guarding", defaults={"provider": "Demo Security Training", "completed_on": timezone.localdate()})
        UniformIssue.objects.get_or_create(guard=guard, item="Security Shirt", issued_on=timezone.localdate(), defaults={"quantity": 2})
        GuardNextOfKin.objects.get_or_create(guard=second_guard, phone="+233-555-0401", defaults={"name": "Jordan Patrol", "relationship": "Parent"})
        GuardTrainingRecord.objects.get_or_create(guard=second_guard, title="Patrol Route Compliance", defaults={"provider": "Demo Security Training", "completed_on": timezone.localdate()})
        UniformIssue.objects.get_or_create(guard=second_guard, item="Reflective Vest", issued_on=timezone.localdate(), defaults={"quantity": 1})
        shift, _ = Shift.objects.get_or_create(
            site=site,
            name="Night Patrol",
            defaults={"starts_at": timezone.now() + timedelta(hours=1), "ends_at": timezone.now() + timedelta(hours=9)},
        )
        second_shift, _ = Shift.objects.get_or_create(
            site=second_site,
            name="Annex Night Patrol",
            defaults={"starts_at": timezone.now() - timedelta(hours=2), "ends_at": timezone.now() + timedelta(hours=6)},
        )
        device, _ = PatrolDevice.objects.get_or_create(
            device_number="WM5000Z-DEMO-001",
            defaults={"name": "Warehouse Patrol Reader", "site": site, "imei": "000000000000000", "connection_mode": PatrolDevice.ConnectionMode.USB},
        )
        second_device, _ = PatrolDevice.objects.get_or_create(
            device_number="WM5000Z-DEMO-002",
            defaults={
                "name": "Annex Patrol Reader",
                "site": second_site,
                "imei": "000000000000001",
                "connection_mode": PatrolDevice.ConnectionMode.USB,
                "sdk_metadata": {
                    "pending_records": [
                        {
                            "device_number": "WM5000Z-DEMO-002",
                            "guard_card_number": "00AFCD2B",
                            "route_code": "annex-route",
                            "checkpoint_code": "ANNEX-CP-1",
                            "source_record_id": "pending-sync-1",
                            "occurred_at": (timezone.now() - timedelta(minutes=35)).isoformat(),
                        }
                    ]
                },
            },
        )
        checkpoints = [
            ("00AFCD11", "North Gate"),
            ("0F2C6002", "Loading Dock"),
            ("00A954A3", "Server Room"),
        ]
        created_checkpoints = []
        checkpoint_coords = {
            "00AFCD11": ("5.604000", "-0.187500"),
            "0F2C6002": ("5.603500", "-0.186800"),
            "00A954A3": ("5.604200", "-0.186500"),
        }
        for code, name in checkpoints:
            lat, lng = checkpoint_coords.get(code, (None, None))
            checkpoint, _ = Checkpoint.objects.get_or_create(
                site=site,
                code=code,
                defaults={"name": name, "event_codes": "0", "latitude": lat, "longitude": lng},
            )
            if lat and lng and (checkpoint.latitude is None or checkpoint.longitude is None):
                checkpoint.latitude = lat
                checkpoint.longitude = lng
                checkpoint.save(update_fields=["latitude", "longitude", "updated_at"])
            created_checkpoints.append(checkpoint)
        route, _ = PatrolRoute.objects.get_or_create(site=site, code="night-route", defaults={"name": "Night Route"})
        for index, checkpoint in enumerate(created_checkpoints, start=1):
            PatrolRouteCheckpoint.objects.get_or_create(route=route, checkpoint=checkpoint, defaults={"sequence": index, "expected_offset_minutes": (index - 1) * 20})
        annex_checkpoint_one, _ = Checkpoint.objects.get_or_create(
            site=second_site,
            code="ANNEX-CP-1",
            defaults={"name": "Fence Corner", "event_codes": "0", "latitude": "5.602800", "longitude": "-0.188100"},
        )
        annex_checkpoint_two, _ = Checkpoint.objects.get_or_create(
            site=second_site,
            code="ANNEX-CP-2",
            defaults={"name": "Fuel Store", "event_codes": "0", "latitude": "5.602500", "longitude": "-0.187700"},
        )
        annex_route, _ = PatrolRoute.objects.get_or_create(site=second_site, code="annex-route", defaults={"name": "Annex Route"})
        PatrolRouteCheckpoint.objects.get_or_create(route=annex_route, checkpoint=annex_checkpoint_one, defaults={"sequence": 1, "expected_offset_minutes": 0})
        PatrolRouteCheckpoint.objects.get_or_create(route=annex_route, checkpoint=annex_checkpoint_two, defaults={"sequence": 2, "expected_offset_minutes": 25})
        assignment, _ = GuardAssignment.objects.get_or_create(guard=guard, shift=shift)
        assignment.patrol_route = route
        assignment.patrol_device = device
        assignment.supervisor = admin_user
        assignment.save(update_fields=["patrol_route", "patrol_device", "supervisor", "updated_at"])
        second_assignment, _ = GuardAssignment.objects.get_or_create(guard=second_guard, shift=second_shift)
        second_assignment.patrol_route = annex_route
        second_assignment.patrol_device = second_device
        second_assignment.supervisor = admin_user
        second_assignment.status = GuardAssignment.Status.CONFIRMED
        second_assignment.deployment_confirmed_at = timezone.now() - timedelta(hours=1)
        second_assignment.save(update_fields=["patrol_route", "patrol_device", "supervisor", "status", "deployment_confirmed_at", "updated_at"])

        AttendanceRecord.objects.get_or_create(
            assignment=second_assignment,
            defaults={
                "checked_in_at": second_shift.starts_at + timedelta(minutes=8),
                "source": AttendanceRecord.Source.MANUAL,
                "notes": "Demo late arrival scenario.",
            },
        )
        PatrolRecord.objects.get_or_create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="seed-record-1",
            device_number=device.device_number,
            defaults={
                "device": device,
                "guard": guard,
                "route": route,
                "checkpoint": created_checkpoints[0],
                "occurred_at": shift.starts_at + timedelta(minutes=5),
                "guard_identifier": guard.employee_number,
                "checkpoint_identifier": created_checkpoints[0].code,
                "raw_payload": {"seeded": True},
            },
        )
        PatrolRecord.objects.get_or_create(
            source=PatrolRecord.Source.MANUAL_IMPORT,
            source_record_id="seed-record-2",
            device_number=device.device_number,
            defaults={
                "device": device,
                "guard": guard,
                "route": route,
                "checkpoint": created_checkpoints[1],
                "occurred_at": shift.starts_at + timedelta(minutes=42),
                "guard_identifier": guard.employee_number,
                "checkpoint_identifier": created_checkpoints[1].code,
                "raw_payload": {"seeded": True},
            },
        )
        PatrolRecord.objects.get_or_create(
            source=PatrolRecord.Source.TCP,
            source_record_id="seed-live-1",
            device_number=device.device_number,
            defaults={
                "device": device,
                "guard": guard,
                "route": route,
                "checkpoint": created_checkpoints[0],
                "occurred_at": timezone.now() - timedelta(minutes=3),
                "guard_identifier": guard.employee_number,
                "checkpoint_identifier": created_checkpoints[0].code,
                "record_type": "GPSCheckPoint",
                "latitude": "5.603950",
                "longitude": "-0.187450",
                "speed": "0.80",
                "satellites": 8,
                "raw_payload": {"seeded_live": True},
            },
        )

        SupervisorInspection.objects.get_or_create(
            site=site,
            inspected_at=shift.starts_at,
            defaults={"supervisor": admin_user, "remarks": "Demo inspection completed.", "status": SupervisorInspection.Status.SUBMITTED},
        )
        SupervisorInspection.objects.get_or_create(
            site=second_site,
            inspected_at=timezone.now() - timedelta(hours=1),
            defaults={"supervisor": admin_user, "remarks": "Annex inspection awaiting review.", "status": SupervisorInspection.Status.DRAFT, "attendance_confirmed": False},
        )
        IncidentReport.objects.get_or_create(
            site=second_site,
            title="Fence alarm triggered",
            defaults={
                "guard": second_guard,
                "reported_by": admin_user,
                "description": "Alarm event logged for annex fence line.",
                "severity": IncidentReport.Severity.HIGH,
                "status": IncidentReport.Status.OPEN,
                "occurred_at": timezone.now() - timedelta(minutes=50),
            },
        )
        ClientComplaint.objects.get_or_create(
            client=client,
            title="Demo complaint",
            defaults={"site": site, "submitted_by": client_user, "description": "Sample client complaint for workflow validation."},
        )
        ReportRequest.objects.get_or_create(
            requested_by=admin_user,
            client=client,
            site=site,
            report_type=ReportRequest.ReportType.CLIENT_SERVICE,
            defaults={"date_from": timezone.localdate(), "date_to": timezone.localdate()},
        )
        ReportRequest.objects.get_or_create(
            requested_by=admin_user,
            client=client,
            site=second_site,
            report_type=ReportRequest.ReportType.PATROL_COMPLETION,
            defaults={"date_from": timezone.localdate(), "date_to": timezone.localdate()},
        )

        evaluate_assignment_patrol(assignment)
        evaluate_assignment_patrol(second_assignment)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded demo data. Admin login: admin / ChangeMe123!. Client login: client / ClientPass123!. Device: {device.device_number}"
            )
        )
