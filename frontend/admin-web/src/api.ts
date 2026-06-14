import {
  APIError,
  extractApiErrorMessage,
  fetchAllList,
  fetchPaginatedList,
  getApiBaseUrl,
  login as sharedLogin,
  logout as sharedLogout,
  request,
  type GenericRecord,
  type LoginResponse as SharedLoginResponse,
  type PaginatedResponse,
} from "@guard/shared";

export type CurrentUser = SharedLoginResponse["user"] & {
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

export {APIError, type GenericRecord, type PaginatedResponse};
export const API_BASE_URL = getApiBaseUrl();

export function login(username: string, password: string): Promise<LoginResponse> {
  return sharedLogin(username, password) as Promise<LoginResponse>;
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

export type LiveGuardPosition = {
  device_id: number;
  device_name: string;
  device_number: string;
  guard_id: number | null;
  guard_name: string;
  assignment_id: number | null;
  site_id: number | null;
  site_name: string;
  latitude: string | null;
  longitude: string | null;
  speed: string | null;
  satellites: number | null;
  last_seen_at: string;
  last_record_type: string;
  is_stale: boolean;
  last_checkpoint_id: number | null;
  last_checkpoint_code: string;
  last_checkpoint_name: string;
  last_checkpoint_at: string | null;
};

export type LiveScanEvent = {
  id: number;
  occurred_at: string;
  guard_id: number | null;
  guard_name: string;
  checkpoint_id: number | null;
  checkpoint_name: string;
  checkpoint_code: string;
  device_number: string;
  source: string;
  record_type: string;
  latitude: string | null;
  longitude: string | null;
};

export type LiveCheckpointMarker = {
  id: number;
  site_id: number;
  site_name: string;
  code: string;
  name: string;
  kind: string;
  latitude: string | null;
  longitude: string | null;
  recently_scanned: boolean;
};

export type LiveMonitoringSnapshot = {
  generated_at: string;
  stale_after_seconds: number;
  site_id: number | null;
  guards: LiveGuardPosition[];
  recent_scans: LiveScanEvent[];
  checkpoints: LiveCheckpointMarker[];
};

export type LiveMonitoringUpdate = {
  type: "live_update";
  generated_at: string;
  site_ids: number[];
  scan: LiveScanEvent;
  guard: LiveGuardPosition | null;
  checkpoint: LiveCheckpointMarker | null;
};

export function fetchLiveMonitoring(token: string, siteId?: number | null): Promise<LiveMonitoringSnapshot> {
  const query = siteId ? `?site_id=${siteId}` : "";
  return request<LiveMonitoringSnapshot>(`/monitoring/live/${query}`, {}, token);
}

export async function fetchSetupData(token: string): Promise<SetupData> {
  const [clients, sites, guards, devices, checkpoints, routes, shifts, reports] = await Promise.all([
    fetchAllList<ClientEntity>("/clients/", token),
    fetchAllList<SiteEntity>("/sites/", token),
    fetchAllList<GuardEntity>("/guards/", token),
    fetchAllList<DeviceEntity>("/devices/", token),
    fetchAllList<CheckpointEntity>("/checkpoints/", token),
    fetchAllList<RouteEntity>("/patrol-routes/", token),
    fetchAllList<ShiftEntity>("/shifts/", token),
    fetchAllList<ReportRequestEntity>("/report-requests/", token),
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
    fetchAllList<GenericRecord>("/client-contracts/", token),
    fetchAllList<GenericRecord>("/incidents/", token),
    fetchAllList<GenericRecord>("/supervisor-inspections/", token),
    fetchAllList<GenericRecord>("/assignments/", token),
    fetchAllList<GenericRecord>("/users/", token),
    fetchAllList<GenericRecord>("/roles/", token),
    fetchAllList<GenericRecord>("/permissions/", token),
    fetchAllList<GenericRecord>("/audit-logs/", token),
    fetchAllList<GenericRecord>("/company-settings/", token),
    fetchAllList<GenericRecord>("/branches/", token),
    fetchAllList<GenericRecord>("/departments/", token),
    fetchAllList<GenericRecord>("/site-instructions/", token),
    fetchAllList<GenericRecord>("/site-emergency-contacts/", token),
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
  return fetchAllList<T>(endpoint, token);
}

export function fetchResourcePage<T = GenericRecord>(
  endpoint: string,
  token: string,
  page = 1,
  pageSize = 25,
): Promise<PaginatedResponse<T>> {
  return fetchPaginatedList<T>(endpoint, token, page, pageSize);
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

export type DeviceCommandOutcome = {
  success: boolean;
  code: number;
  message: string;
  payload?: Record<string, unknown>;
};

export type DeviceSyncResult = {
  device: number;
  open_result: DeviceCommandOutcome;
  records_result: DeviceCommandOutcome;
  import: {
    imported_count: number;
    duplicate_count: number;
    record_ids: number[];
    evaluated_assignments: number[];
  };
  clear_result: DeviceCommandOutcome | null;
  close_result: DeviceCommandOutcome | null;
};

export type DeviceNetworkConfigPayload = {
  network_mode?: "ip" | "domain";
  ip?: string;
  domain?: string;
  dns?: string;
  port: number;
  apn?: string;
  userid?: string;
  password?: string;
  pin1?: string;
  pin2?: string;
};

export type DeviceNetworkConfigResult = {
  device: number;
  open_result: DeviceCommandOutcome;
  config_result: DeviceCommandOutcome;
  dial_result: DeviceCommandOutcome | null;
  imei_result: DeviceCommandOutcome | null;
  close_result: DeviceCommandOutcome | null;
};

export function syncPatrolDevice(
  deviceId: number,
  payload: {clear_device_after_sync?: boolean},
  token: string,
): Promise<DeviceSyncResult> {
  return createRequest<DeviceSyncResult>(`/devices/${deviceId}/sync/`, payload, token);
}

export function configurePatrolDeviceNetwork(
  deviceId: number,
  payload: DeviceNetworkConfigPayload,
  token: string,
): Promise<DeviceNetworkConfigResult> {
  return createRequest<DeviceNetworkConfigResult>(`/devices/${deviceId}/configure-network/`, payload, token);
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

export function logout(token: string): Promise<void> {
  return sharedLogout(token);
}
