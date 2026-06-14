import React, { useEffect, useMemo, useRef, useState } from "react";
import { NAV_ITEMS } from "../navigation/config";
import { buildRecordFocus } from "../lib/record-focus";
import { PageContext, RecordFocus, RouteKey } from "../types/ui";

type PaletteItem = {
  id: string;
  label: string;
  subtitle?: string;
  group: string;
  route: RouteKey;
  focus?: RecordFocus;
};

function buildPaletteItems(context: PageContext): PaletteItem[] {
  const modules: PaletteItem[] = NAV_ITEMS.map((item) => ({
    id: `module-${item.route}`,
    label: item.label,
    subtitle: item.group,
    group: "Modules",
    route: item.route,
  }));

  const records: PaletteItem[] = [];
  for (const client of context.setupData?.clients ?? []) {
    records.push({
      id: `client-${client.id}`,
      label: client.name,
      subtitle: `Client · ${client.code}`,
      group: "Records",
      route: "clients/clients",
      focus: buildRecordFocus("client", client.id, client.name),
    });
  }
  for (const site of context.setupData?.sites ?? []) {
    records.push({
      id: `site-${site.id}`,
      label: site.name,
      subtitle: `Site · ${site.code}`,
      group: "Records",
      route: "operations/sites",
      focus: buildRecordFocus("site", site.id, site.name),
    });
  }
  for (const guard of context.setupData?.guards ?? []) {
    const label = `${guard.first_name} ${guard.last_name}`.trim();
    records.push({
      id: `guard-${guard.id}`,
      label,
      subtitle: `Guard · ${guard.employee_number}`,
      group: "Records",
      route: "operations/guards",
      focus: buildRecordFocus("guard", guard.id, label),
    });
  }
  for (const device of context.setupData?.devices ?? []) {
    records.push({
      id: `device-${device.id}`,
      label: device.name,
      subtitle: `Device · ${device.device_number}`,
      group: "Records",
      route: "patrol/devices",
      focus: buildRecordFocus("device", device.id, device.name),
    });
  }

  return [...modules, ...records];
}

export function CommandPalette({
  open,
  onClose,
  context,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  context: PageContext;
  onNavigate: (route: RouteKey, focus?: RecordFocus | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const items = useMemo(() => buildPaletteItems(context), [context.setupData]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items.slice(0, 12);
    }
    return items
      .filter((item) => `${item.label} ${item.subtitle ?? ""} ${item.group}`.toLowerCase().includes(needle))
      .slice(0, 12);
  }, [items, query]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Enter" && filtered[safeActiveIndex]) {
        event.preventDefault();
        const item = filtered[safeActiveIndex];
        onNavigate(item.route, item.focus ?? null);
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, safeActiveIndex, onClose, onNavigate]);

  if (!open) {
    return null;
  }

  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {});

  let rowIndex = -1;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-palette-input-wrap">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Jump to module or search records…"
            aria-label="Search modules and records"
            autoFocus={open}
          />
          <kbd className="command-kbd">Esc</kbd>
        </div>
        <div className="command-palette-results">
          {filtered.length ? (
            Object.entries(grouped).map(([group, groupItems]) => (
              <section key={group} className="command-group">
                <p className="command-group-label">{group}</p>
                {groupItems.map((item) => {
                  rowIndex += 1;
                  const isActive = rowIndex === safeActiveIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`command-item ${isActive ? "active" : ""}`}
                      onMouseEnter={() => setActiveIndex(rowIndex)}
                      onClick={() => {
                        onNavigate(item.route, item.focus ?? null);
                        onClose();
                      }}
                    >
                      <span className="command-item-label">{item.label}</span>
                      {item.subtitle ? <span className="command-item-sub">{item.subtitle}</span> : null}
                    </button>
                  );
                })}
              </section>
            ))
          ) : (
            <p className="command-empty">No matches.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
