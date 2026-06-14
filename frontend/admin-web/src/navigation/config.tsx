import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart2,
  FileClock,
  Fingerprint,
  LayoutDashboard,
  RadioTower,
  ScrollText,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShieldUser,
  Siren,
  Users,
  UserCheck,
} from "lucide-react";
import { NavItem } from "../types/ui";

export const FLOW_STEPS = [
  {label: "Clients", key: "clients", icon: BriefcaseBusiness},
  {label: "Sites", key: "sites", icon: Building2},
  {label: "Guards", key: "guards", icon: Users},
  {label: "Devices", key: "devices", icon: RadioTower},
  {label: "Checkpoints", key: "checkpoints", icon: Fingerprint},
  {label: "Routes", key: "patrol_routes", icon: ShieldCheck},
  {label: "Assignments", key: "assignments", icon: UserCheck},
  {label: "Patrol Records", key: "patrol_records", icon: ClipboardCheck},
  {label: "Reports", key: "reports", icon: FileBarChart2},
] as const;

export const NAV_ITEMS: NavItem[] = [
  {route: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Command view for deployment, exceptions, incidents, and recent output.", group: "Overview"},
  {route: "operations/sites", label: "Sites", icon: Building2, description: "Operational site register, readiness, and staffing context.", group: "Operations", actionLabel: "New Site", actionRoute: "operations/sites/new"},
  {route: "operations/guards", label: "Guards", icon: Users, description: "Guard roster with quick access to employee identities and status.", group: "Operations", actionLabel: "New Guard", actionRoute: "operations/guards/new"},
  {route: "operations/shifts", label: "Shifts", icon: CalendarClock, description: "Shift planning windows and their site coverage.", group: "Operations", actionLabel: "New Shift", actionRoute: "operations/shifts/new"},
  {route: "operations/assignments", label: "Assignments", icon: UserCheck, description: "Deployment board for guard-to-shift placement.", group: "Operations", actionLabel: "New Assignment", actionRoute: "operations/assignments/new"},
  {route: "patrol/devices", label: "Devices", icon: RadioTower, description: "Patrol hardware inventory and deployment status.", group: "Patrol", actionLabel: "New Device", actionRoute: "patrol/devices/new"},
  {route: "patrol/checkpoints", label: "Checkpoints", icon: Fingerprint, description: "Patrol verification points and checkpoint coding.", group: "Patrol", actionLabel: "New Checkpoint", actionRoute: "patrol/checkpoints/new"},
  {route: "patrol/routes", label: "Routes", icon: ShieldCheck, description: "Patrol route definitions and sequencing setup.", group: "Patrol", actionLabel: "New Route", actionRoute: "patrol/routes/new"},
  {route: "patrol/monitoring", label: "Monitoring", icon: ShieldAlert, description: "Live patrol activity, attendance, device assignment, and exceptions.", group: "Patrol"},
  {route: "incidents/center", label: "Incident Center", icon: Siren, description: "Active incidents with severity and operational state.", group: "Incidents"},
  {route: "incidents/inspections", label: "Supervisor Inspections", icon: ClipboardCheck, description: "Inspection outcomes and supervisory follow-up.", group: "Incidents"},
  {route: "clients/clients", label: "Clients", icon: BriefcaseBusiness, description: "Customer organizations served by operations teams.", group: "Clients", actionLabel: "New Client", actionRoute: "clients/clients/new"},
  {route: "clients/contracts", label: "Contracts", icon: FileClock, description: "Service contracts and SLA setup with live backend records.", group: "Clients"},
  {route: "clients/site-access", label: "Site Access", icon: ScrollText, description: "Site instructions, emergency contacts, and access-readiness notes.", group: "Clients"},
  {route: "reports", label: "Reports", icon: FileBarChart2, description: "Report request queue, exports, and delivery tracking.", group: "Reports", actionLabel: "New Report", actionRoute: "reports/new"},
  {route: "admin/users", label: "Users", icon: ShieldUser, description: "Internal account overview backed by the API.", group: "Administration"},
  {route: "admin/roles", label: "Roles", icon: CheckCircle2, description: "Role definitions and current permission scaffolding.", group: "Administration"},
  {route: "admin/audit-logs", label: "Audit Logs", icon: ScrollText, description: "Trace recent system changes and operational accountability.", group: "Administration"},
  {route: "admin/settings", label: "Settings", icon: Settings2, description: "Company profile, branches, departments, and current platform readiness.", group: "Administration"},
];

export const STATUS_TONES: Record<string, string> = {
  active: "success",
  completed: "success",
  resolved: "success",
  checked_in: "success",
  records_synced: "success",
  pass: "success",
  open: "danger",
  critical: "danger",
  faulty: "danger",
  late: "warning",
  absent: "warning",
  escalated: "warning",
  in_progress: "warning",
  investigating: "warning",
  submitted: "warning",
  draft: "info",
  pending: "info",
  scheduled: "info",
  awaiting_sync: "info",
  awaiting_attendance: "warning",
  route_missing: "warning",
  exceptions: "danger",
  maintenance: "offline",
  inactive: "offline",
  offline: "offline",
};

export function groupNavItems() {
  const grouped = new Map<string, NavItem[]>();
  for (const item of NAV_ITEMS) {
    if (!grouped.has(item.group)) {
      grouped.set(item.group, []);
    }
    grouped.get(item.group)!.push(item);
  }
  return Array.from(grouped.entries());
}
