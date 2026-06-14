export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type LoginResponse = {
  token: string;
  expires_at?: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role_code: string | null;
    role_name: string | null;
    is_staff?: boolean;
    client?: number | null;
  };
};

export class APIError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "APIError";
    this.details = details;
  }
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
}

export function getMonitoringWebSocketUrl(token: string, siteId?: number | null) {
  const apiBase = getApiBaseUrl().replace(/\/$/, "");
  const httpOrigin = apiBase.replace(/\/api\/v1$/, "");
  const wsOrigin = httpOrigin.replace(/^http/i, (scheme) => (scheme === "https" ? "wss" : "ws"));
  const params = new URLSearchParams({token});
  if (siteId) {
    params.set("site_id", String(siteId));
  }
  return `${wsOrigin}/ws/monitoring/live/?${params.toString()}`;
}

export function extractApiErrorMessage(status: number, details: unknown) {
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

export async function request<T>(path: string, options: RequestInit = {}, token = ""): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {...options, headers});
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = null;
    }
    throw new APIError(extractApiErrorMessage(response.status, details), details);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

function normalizeEndpoint(endpoint: string) {
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

function buildListPath(endpoint: string, page = 1, pageSize?: number) {
  const params = new URLSearchParams({page: String(page)});
  if (pageSize) {
    params.set("page_size", String(pageSize));
  }
  return `${normalizeEndpoint(endpoint)}?${params.toString()}`;
}

export async function fetchPaginatedList<T>(
  endpoint: string,
  token: string,
  page = 1,
  pageSize?: number,
): Promise<PaginatedResponse<T>> {
  return request<PaginatedResponse<T>>(buildListPath(endpoint, page, pageSize), {}, token);
}

export async function fetchAllList<T>(endpoint: string, token: string, pageSize = 100): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const response = await fetchPaginatedList<T>(endpoint, token, page, pageSize);
    items.push(...response.results);
    if (!response.next) {
      return items;
    }
    page += 1;
  }
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({username, password}),
  });
}

export async function logout(token: string): Promise<void> {
  await request<void>(
    "/auth/logout/",
    {
      method: "POST",
    },
    token,
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
}

export function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function looksLikeDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

export function formatUnknown(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string") {
    return looksLikeDate(value) ? formatDate(value) : value;
  }
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

export type GenericRecord = {
  id: number;
  [key: string]: unknown;
};

export function stringifyRecord(record: GenericRecord) {
  return Object.values(record)
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();
}

export function buildNameMap(items: Array<{id: number; name?: string; first_name?: string; last_name?: string}>) {
  return Object.fromEntries(
    items.map((item) => {
      const fallback = [item.first_name, item.last_name].filter(Boolean).join(" ");
      return [item.id, item.name ?? fallback];
    }),
  ) as Record<number, string>;
}

export function toOptions(items: Array<{id: number; name?: string}>) {
  return items.map((item) => ({value: String(item.id), label: item.name ?? `Item ${item.id}`}));
}

export function extractFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(details as Record<string, unknown>)
      .filter(([, value]) => Array.isArray(value) || typeof value === "string")
      .map(([key, value]) => [key, Array.isArray(value) ? value.map(String).join(" ") : String(value)]),
  );
}

export function buildPaginationSummary(page: number, pageSize: number, total: number) {
  if (!total) {
    return "No records";
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}-${end} of ${total}`;
}
