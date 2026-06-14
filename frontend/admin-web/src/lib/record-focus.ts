import { CrudConfigKey } from "../crud/config";
import { RecordFocus, RecordFocusKind, RouteKey } from "../types/ui";

const FOCUS_CONFIG: Record<RecordFocusKind, {route: RouteKey; configKey: CrudConfigKey; tab?: string}> = {
  client: {route: "clients/clients", configKey: "clients", tab: "clients"},
  site: {route: "operations/sites", configKey: "sites"},
  guard: {route: "operations/guards", configKey: "guards", tab: "guards"},
  device: {route: "patrol/devices", configKey: "devices"},
};

export function recordFocusMatchesConfig(focus: RecordFocus | null, configKey: CrudConfigKey) {
  if (!focus) {
    return false;
  }
  return FOCUS_CONFIG[focus.kind].configKey === configKey;
}

export function recordFocusTab(focus: RecordFocus | null) {
  if (!focus) {
    return undefined;
  }
  return FOCUS_CONFIG[focus.kind].tab;
}

export function buildRecordFocus(
  kind: RecordFocusKind,
  id: number,
  label: string,
): RecordFocus {
  const mapping = FOCUS_CONFIG[kind];
  return {
    kind,
    id,
    label,
    route: mapping.route,
    tab: mapping.tab,
  };
}
