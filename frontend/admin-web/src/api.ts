export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_code: string | null;
  role_name: string | null;
  is_staff: boolean;
};

export type LoginResponse = {
  token: string;
  user: CurrentUser;
};

export type BasicEntity = {
  id: number;
  name?: string;
  code?: string;
};

export type ClientEntity = BasicEntity & {
  name: string;
  code: string;
};

export type SiteEntity = BasicEntity & {
  name: string;
  code: string;
  client: number;
  status?: string;
  required_guards?: number;
  address?: string;
};

export type GuardEntity = {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  status?: string;
};

export type DeviceEntity = BasicEntity & {
  name: string;
  device_number: string;
  site?: number;
  status?: string;
};

export type CheckpointEntity = BasicEntity & {
  name: string;
  code: string;
  site?: number;
};

export type RouteEntity = BasicEntity & {
  name: string;
  code: string;
  site?: number;
};

export type ShiftEntity = BasicEntity & {
  id: number;
  name: string;
  site: number;
  starts_at: string;
  ends_at: string;
  status?: string;
};

export type ReportRequestEntity = {
  id: number;
  report_type: string;
  status: string;
  client: number | null;
  site: number | null;
  created_at: string;
  summary?: string;
};

export type AssignmentCard = {
  id: number;
  client_name: string;
  site_name: string;
  guard_name: string;
  shift_name: string;
  shift_starts_at: string;
  shift_ends_at: string;
  assignment_status: string;
  attendance_status: string;
  patrol_status: string;
  route_name: string | null;
  device_name: string | null;
  supervisor_name: string | null;
  open_exception_count: number;
  patrol_record_count: number;
};

export type SitePerformanceRow = {
  id: number;
  client_name: string;
  site_name: string;
  required_guards: number;
  assigned_guards: number;
  route_count: number;
  device_count: number;
  open_incident_count: number;
  open_exception_count: number;
  last_inspected_at: string | null;
};

export type PatrolExceptionRow = {
  id: number;
  site_name: string;
  guard_name: string;
  checkpoint_name: string | null;
  exception_type: string;
  status: string;
  expected_at: string | null;
};

export type IncidentRow = {
  id: number;
  site_name: string;
  client_name: string;
  title: string;
  severity: string;
  status: string;
  occurred_at: string;
};

export type SupervisorReviewRow = {
  id: number;
  site_name: string;
  supervisor_name: string | null;
  status: string;
  inspected_at: string;
  attendance_confirmed: boolean;
  patrol_device_ok: boolean;
};

export type OperationsOverview = {
  flow: {
    clients: number;
    sites: number;
    guards: number;
    devices: number;
    checkpoints: number;
    patrol_routes: number;
    assignments: number;
    patrol_records: number;
    reports: number;
  };
  metrics: {
    guards_on_duty: number;
    absent_guards: number;
    late_guards: number;
    active_sites: number;
    missed_patrols: number;
    open_incidents: number;
    faulty_devices: number;
    pending_supervisor_reviews: number;
  };
  assignment_board: AssignmentCard[];
  site_performance: SitePerformanceRow[];
  patrol_exceptions: PatrolExceptionRow[];
  incidents: IncidentRow[];
  supervisor_reviews: SupervisorReviewRow[];
};

export type DashboardSummary = {
  clients: number;
  sites: number;
  guards: number;
  shifts: number;
  assignments: number;
  devices: number;
  checkpoints: number;
  patrol_routes: number;
  patrol_records: number;
  open_incidents: number;
};

export type SetupData = {
  clients: ClientEntity[];
  sites: SiteEntity[];
  guards: GuardEntity[];
  devices: DeviceEntity[];
  checkpoints: CheckpointEntity[];
  routes: RouteEntity[];
  shifts: ShiftEntity[];
  reports: ReportRequestEntity[];
};

export type GenericRecord = {
  id: number;
  [key: string]: unknown;
};

export type SupportData = {
  contracts: GenericRecord[];
  incidents: GenericRecord[];
  supervisorInspections: GenericRecord[];
  assignments: GenericRecord[];
  users: GenericRecord[];
  roles: GenericRecord[];
  permissions: GenericRecord[];
  auditLogs: GenericRecord[];
  companySettings: GenericRecord[];
  branches: GenericRecord[];
  departments: GenericRecord[];
  siteInstructions: GenericRecord[];
  siteEmergencyContacts: GenericRecord[];
};

export type ResourceOptionsField = {
  type?: string;
  required?: boolean;
  read_only?: boolean;
  label?: string;
  max_length?: number;
  choices?: Array<{display_name: string; value: string | number}>;
};

export type ResourceOptions = {
  name?: string;
  description?: string;
  renders?: string[];
  actions?: {
    POST?: Record<string, ResourceOptionsField>;
    PUT?: Record<string, ResourceOptionsField>;
    PATCH?: Record<string, ResourceOptionsField>;
  };
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export class APIError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "APIError";
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token = ""): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {...options, headers});
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = null;
    }
    throw new APIError(extractApiErrorMessage(response.status, details), details);
  }
  return response.json();
}

function extractApiErrorMessage(status: number, details: unknown) {
  if (typeof details === "string" && details.trim()) {
    return details;
  }
  if (details && typeof details === "object") {
    const values = Object.values(details as Record<string, unknown>).flatMap((value) =>
      Array.isArray(value) ? value.map(String) : [String(value)],
    );
    if (values.length) {
      return values.join(" ");
    }
  }
  return `API request failed with ${status}`;
}

function listRequest<T>(path: string, token: string): Promise<T[]> {
  return request<T[]>(path, {}, token);
}

function createRequest<T>(path: string, payload: Record<string, unknown>, token: string): Promise<T> {
  return request<T>(
    path,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({username, password}),
  });
}

export function fetchCurrentUser(token: string): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me/", {}, token);
}

export function fetchDashboardSummary(token: string): Promise<DashboardSummary> {
  return request<DashboardSummary>("/dashboard/summary/", {}, token);
}

export function fetchOperationsOverview(token: string): Promise<OperationsOverview> {
  return request<OperationsOverview>("/dashboard/operations/", {}, token);
}

export async function fetchSetupData(token: string): Promise<SetupData> {
  const [clients, sites, guards, devices, checkpoints, routes, shifts, reports] = await Promise.all([
    listRequest<ClientEntity>("/clients/", token),
    listRequest<SiteEntity>("/sites/", token),
    listRequest<GuardEntity>("/guards/", token),
    listRequest<DeviceEntity>("/devices/", token),
    listRequest<CheckpointEntity>("/checkpoints/", token),
    listRequest<RouteEntity>("/patrol-routes/", token),
    listRequest<ShiftEntity>("/shifts/", token),
    listRequest<ReportRequestEntity>("/report-requests/", token),
  ]);

  return {clients, sites, guards, devices, checkpoints, routes, shifts, reports};
}

export async function fetchSupportData(token: string): Promise<SupportData> {
  const [
    contracts,
    incidents,
    supervisorInspections,
    assignments,
    users,
    roles,
    permissions,
    auditLogs,
    companySettings,
    branches,
    departments,
    siteInstructions,
    siteEmergencyContacts,
  ] = await Promise.all([
    listRequest<GenericRecord>("/client-contracts/", token),
    listRequest<GenericRecord>("/incidents/", token),
    listRequest<GenericRecord>("/supervisor-inspections/", token),
    listRequest<GenericRecord>("/assignments/", token),
    listRequest<GenericRecord>("/users/", token),
    listRequest<GenericRecord>("/roles/", token),
    listRequest<GenericRecord>("/permissions/", token),
    listRequest<GenericRecord>("/audit-logs/", token),
    listRequest<GenericRecord>("/company-settings/", token),
    listRequest<GenericRecord>("/branches/", token),
    listRequest<GenericRecord>("/departments/", token),
    listRequest<GenericRecord>("/site-instructions/", token),
    listRequest<GenericRecord>("/site-emergency-contacts/", token),
  ]);

  return {
    contracts,
    incidents,
    supervisorInspections,
    assignments,
    users,
    roles,
    permissions,
    auditLogs,
    companySettings,
    branches,
    departments,
    siteInstructions,
    siteEmergencyContacts,
  };
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

export function fetchResourceList<T = GenericRecord>(endpoint: string, token: string): Promise<T[]> {
  return listRequest<T>(normalizeEndpoint(endpoint), token);
}

export function createResource<T = GenericRecord>(endpoint: string, payload: Record<string, unknown>, token: string): Promise<T> {
  return createRequest<T>(normalizeEndpoint(endpoint), payload, token);
}

export function updateResource<T = GenericRecord>(endpoint: string, id: number, payload: Record<string, unknown>, token: string): Promise<T> {
  return request<T>(
    `${normalizeEndpoint(endpoint)}${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteResource(endpoint: string, id: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${normalizeEndpoint(endpoint)}${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  if (!response.ok && response.status !== 204) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = null;
    }
    throw new APIError(extractApiErrorMessage(response.status, details), details);
  }
}

export function fetchResourceOptions(endpoint: string, token: string): Promise<ResourceOptions> {
  return request<ResourceOptions>(
    normalizeEndpoint(endpoint),
    {
      method: "OPTIONS",
    },
    token,
  );
}

export function createClient(payload: Record<string, unknown>, token: string) {
  return createRequest<ClientEntity>("/clients/", payload, token);
}

export function createSite(payload: Record<string, unknown>, token: string) {
  return createRequest<SiteEntity>("/sites/", payload, token);
}

export function createGuard(payload: Record<string, unknown>, token: string) {
  return createRequest<GuardEntity>("/guards/", payload, token);
}

export function createDevice(payload: Record<string, unknown>, token: string) {
  return createRequest<DeviceEntity>("/devices/", payload, token);
}

export function createCheckpoint(payload: Record<string, unknown>, token: string) {
  return createRequest<CheckpointEntity>("/checkpoints/", payload, token);
}

export function createRoute(payload: Record<string, unknown>, token: string) {
  return createRequest<RouteEntity>("/patrol-routes/", payload, token);
}

export function createRouteCheckpoint(payload: Record<string, unknown>, token: string) {
  return createRequest("/patrol-route-checkpoints/", payload, token);
}

export function createShift(payload: Record<string, unknown>, token: string) {
  return createRequest<ShiftEntity>("/shifts/", payload, token);
}

export function createAssignment(payload: Record<string, unknown>, token: string) {
  return createRequest("/assignments/", payload, token);
}

export function createReportRequest(payload: Record<string, unknown>, token: string) {
  return createRequest<ReportRequestEntity>("/report-requests/", payload, token);
}

export async function downloadReport(reportId: number, format: "csv" | "json", token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/report-requests/${reportId}/export/?format=${format}`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Report export failed with ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `report-${reportId}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function logout(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Logout failed with ${response.status}`);
  }
}
