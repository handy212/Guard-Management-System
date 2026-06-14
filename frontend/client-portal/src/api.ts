export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_code: string | null;
  role_name: string | null;
  client: number | null;
};

export type LoginResponse = {
  token: string;
  user: CurrentUser;
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

export type ComplaintItem = {
  id: number;
  client: number;
  site: number | null;
  submitted_by: number | null;
  title: string;
  description: string;
  status: string;
  created_at: string;
  site_name?: string | null;
};

export type ReportItem = {
  id: number;
  requested_by: number | null;
  client: number | null;
  site: number | null;
  report_type: string;
  status: string;
  created_at: string;
  summary?: {
    report_type: string;
    totals: Record<string, number>;
    scope: Record<string, string | number | null>;
    site_breakdown: Array<Record<string, string | number>>;
  };
  site_name?: string | null;
};

export type ClientPortalOverview = {
  client: {
    id: number;
    name: string;
    code: string;
  };
  metrics: {
    sites: number;
    scheduled_shifts: number;
    assignments: number;
    patrol_records: number;
    open_incidents: number;
    open_complaints: number;
  };
  sites: Array<{
    id: number;
    name: string;
    address: string;
    required_guards: number;
    assigned_guards: number;
    route_count: number;
    device_count: number;
    open_incident_count: number;
    last_patrol_record_at: string | null;
    last_inspected_at: string | null;
  }>;
  attendance_and_deployments: AssignmentCard[];
  patrol_exceptions: Array<{
    id: number;
    site_name: string;
    guard_name: string;
    checkpoint_name: string | null;
    exception_type: string;
    status: string;
    expected_at: string | null;
  }>;
  incidents: Array<{
    id: number;
    site_name: string;
    title: string;
    severity: string;
    status: string;
    occurred_at: string;
  }>;
  supervisor_inspections: Array<{
    id: number;
    site_name: string;
    status: string;
    inspected_at: string;
    remarks: string;
  }>;
  complaints: ComplaintItem[];
  reports: ReportItem[];
};

export type ComplaintInput = {
  site?: number;
  title: string;
  description: string;
};

export type ReportRequestInput = {
  site?: number;
  report_type: string;
  date_from?: string;
  date_to?: string;
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}, token = ""): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {...options, headers});
  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }
  return response.json();
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({username, password}),
  });
}

export function fetchClientPortalOverview(token: string): Promise<ClientPortalOverview> {
  return request<ClientPortalOverview>("/client-portal/overview/", {}, token);
}

export function createComplaint(input: ComplaintInput, token: string): Promise<ComplaintItem> {
  return request<ComplaintItem>(
    "/client-portal/complaints/",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function requestReport(input: ReportRequestInput, token: string): Promise<ReportItem> {
  return request<ReportItem>(
    "/client-portal/report-requests/",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
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
