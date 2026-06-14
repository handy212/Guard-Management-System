import { NAV_ITEMS } from "../navigation/config";
import { RouteKey } from "../types/ui";

export const DEFAULT_ROUTE: RouteKey = "dashboard";

export function isCreateRoute(route: RouteKey) {
  return route.endsWith("/new") || route === "patrol/routes/steps/new";
}

export function getRouteFromHash(): RouteKey {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const candidate = (hash || DEFAULT_ROUTE) as RouteKey;
  return NAV_ITEMS.some((item) => candidate === item.route) || isCreateRoute(candidate) ? candidate : DEFAULT_ROUTE;
}

export function setHashRoute(route: RouteKey) {
  window.location.hash = route;
}
