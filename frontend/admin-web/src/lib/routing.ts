import { NAV_ITEMS } from "../navigation/config";
import { RouteKey } from "../types/ui";

export const DEFAULT_ROUTE: RouteKey = "dashboard";

const LEGACY_CREATE_ROUTES: Record<string, RouteKey> = {
  "clients/clients/new": "clients/clients",
  "operations/sites/new": "operations/sites",
  "operations/guards/new": "operations/guards",
  "operations/shifts/new": "operations/shifts",
  "operations/assignments/new": "operations/assignments",
  "patrol/devices/new": "patrol/devices",
  "patrol/checkpoints/new": "patrol/checkpoints",
  "patrol/routes/new": "patrol/routes",
  "patrol/routes/steps/new": "patrol/routes",
  "reports/new": "reports",
};

export function normalizeRoute(candidate: string): RouteKey {
  if (candidate in LEGACY_CREATE_ROUTES) {
    return LEGACY_CREATE_ROUTES[candidate];
  }
  return candidate as RouteKey;
}

export function getRouteFromHash(): RouteKey {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const candidate = normalizeRoute(hash || DEFAULT_ROUTE);
  return NAV_ITEMS.some((item) => candidate === item.route) ? candidate : DEFAULT_ROUTE;
}

export function setHashRoute(route: RouteKey) {
  window.location.hash = route;
}
