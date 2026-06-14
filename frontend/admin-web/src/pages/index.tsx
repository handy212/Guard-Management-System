import React from "react";
import { NAV_ITEMS } from "../navigation/config";
import { PageContext, RouteKey } from "../types/ui";
import { DashboardPage } from "./dashboard/index";
import { ClientsPage, ContractsPage, SiteAccessPage } from "./clients/index";
import { AssignmentsPage, GuardsPage, ShiftsPage, SitesPage } from "./operations/index";
import {
  CheckpointsPage,
  DevicesPage,
  MonitoringPage,
  RoutesPage,
} from "./patrol/index";
import { IncidentCenterPage, InspectionPage } from "./incidents/index";
import { ReportsPage } from "./reports/index";
import { AuditLogsPage, RolesPage, SettingsPage, UsersPage } from "./admin/index";

export function getPageMeta(route: RouteKey) {
  const currentNavItem = NAV_ITEMS.find((item) => route === item.route || route.startsWith(`${item.route}/`)) ?? NAV_ITEMS[0];

  return {
    currentNavItem,
    pageTitle: currentNavItem.label,
    pageDescription: currentNavItem.description,
  };
}

export function renderRoute(route: RouteKey, context: PageContext) {
  switch (route) {
    case "dashboard":
      return <DashboardPage context={context} />;
    case "patrol/monitoring":
      return <MonitoringPage context={context} />;
    case "operations/assignments":
      return <AssignmentsPage context={context} />;
    case "operations/sites":
      return <SitesPage context={context} />;
    case "operations/guards":
      return <GuardsPage context={context} />;
    case "operations/shifts":
      return <ShiftsPage context={context} />;
    case "patrol/devices":
      return <DevicesPage context={context} />;
    case "patrol/checkpoints":
      return <CheckpointsPage context={context} />;
    case "patrol/routes":
      return <RoutesPage context={context} />;
    case "incidents/center":
      return <IncidentCenterPage context={context} />;
    case "incidents/inspections":
      return <InspectionPage context={context} />;
    case "clients/clients":
      return <ClientsPage context={context} />;
    case "clients/contracts":
      return <ContractsPage context={context} />;
    case "clients/site-access":
      return <SiteAccessPage context={context} />;
    case "reports":
      return <ReportsPage context={context} />;
    case "admin/users":
      return <UsersPage context={context} />;
    case "admin/roles":
      return <RolesPage context={context} />;
    case "admin/audit-logs":
      return <AuditLogsPage context={context} />;
    case "admin/settings":
      return <SettingsPage context={context} />;
    default:
      return <DashboardPage context={context} />;
  }
}
