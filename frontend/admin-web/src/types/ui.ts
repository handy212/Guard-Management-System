import React from "react";
import { CurrentUser, OperationsOverview, SetupData, SupportData, fetchDashboardSummary } from "../api";

export type RouteKey =
  | "dashboard"
  | "operations/sites"
  | "operations/sites/new"
  | "operations/guards"
  | "operations/guards/new"
  | "operations/shifts"
  | "operations/shifts/new"
  | "operations/assignments"
  | "operations/assignments/new"
  | "patrol/devices"
  | "patrol/devices/new"
  | "patrol/checkpoints"
  | "patrol/checkpoints/new"
  | "patrol/routes"
  | "patrol/routes/new"
  | "patrol/routes/steps/new"
  | "patrol/monitoring"
  | "incidents/center"
  | "incidents/inspections"
  | "clients/clients"
  | "clients/clients/new"
  | "clients/contracts"
  | "clients/site-access"
  | "reports"
  | "reports/new"
  | "admin/users"
  | "admin/roles"
  | "admin/audit-logs"
  | "admin/settings";

export type NavItem = {
  route: RouteKey;
  label: string;
  icon: React.ComponentType<{size?: number}>;
  description: string;
  group: string;
  actionLabel?: string;
  actionRoute?: RouteKey;
};

export type DashboardSummary = Awaited<ReturnType<typeof fetchDashboardSummary>>;

export type Column<T> = {
  label: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export type PageContext = {
  user: CurrentUser | null;
  overview: OperationsOverview | null;
  summary: DashboardSummary | null;
  setupData: SetupData | null;
  supportData: SupportData | null;
  token: string;
  message: string;
  error: string;
  isSubmitting: boolean;
  isLoading: boolean;
  navigate: (route: RouteKey) => void;
  refreshAll: (activeToken?: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  runAction: (action: () => Promise<unknown>, successMessage: string, afterSuccess?: () => void) => Promise<void>;
  onReportDownload: (reportId: number, format: "csv" | "json") => Promise<void>;
};
