import { GenericRecord } from "../api";

export function formatDate(value: string) {
  return new Date(value).toLocaleString([], {year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
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

export function stringifyRecord(record: GenericRecord) {
  return Object.values(record).map((value) => String(value ?? "")).join(" ").toLowerCase();
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
