import React, { useState } from "react";
import { AssignmentCard } from "../../api";
import { LiveMonitoringPanel } from "../../components/live-monitoring";
import { ResourceCrudPage } from "../../components/resource-crud";
import { TabbedPage } from "../../components/page-shell";
import { formatDate, formatTime, humanize } from "../../lib/format";
import { DataTable, EmptyState, FilterBar, KpiStrip, Panel, StatusBadge } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function MonitoringPage({context}: {context: PageContext}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"live" | "board" | "records" | "exceptions">("live");
  const overview = context.overview;

  const kpis = overview
    ? [
        {label: "On duty", value: overview.metrics.guards_on_duty},
        {label: "Absent", value: overview.metrics.absent_guards, alert: overview.metrics.absent_guards > 0},
        {label: "Late", value: overview.metrics.late_guards, alert: overview.metrics.late_guards > 0},
        {label: "Missed patrols", value: overview.metrics.missed_patrols, alert: overview.metrics.missed_patrols > 0},
        {label: "Open incidents", value: overview.metrics.open_incidents, alert: overview.metrics.open_incidents > 0},
        {label: "Device flags", value: overview.metrics.faulty_devices, alert: overview.metrics.faulty_devices > 0},
      ]
    : [];

  const rows = (overview?.assignment_board ?? []).filter((item) => {
    const haystack = `${item.site_name} ${item.guard_name} ${item.shift_name} ${item.device_name ?? ""} ${item.route_name ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const exceptionRows = (overview?.patrol_exceptions ?? []).slice(0, 6);

  return (
    <TabbedPage
      tabs={[
        {key: "live", label: "Live map"},
        {key: "board", label: "Live board"},
        {key: "records", label: "Patrol records"},
        {key: "exceptions", label: "Exceptions"},
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "live" ? <LiveMonitoringPanel context={context} /> : null}
      {activeTab === "board" ? (
        <div className="page-stack">
          <KpiStrip items={kpis} />
          {context.summary ? (
            <div className="footprint-strip">
              <span>Assignments <strong>{context.summary.assignments}</strong></span>
              <span>Patrol records <strong>{context.summary.patrol_records}</strong></span>
              <span>Devices <strong>{context.summary.devices}</strong></span>
              <span>Routes <strong>{context.summary.patrol_routes}</strong></span>
            </div>
          ) : null}
          <section className="dashboard-grid">
            <Panel title="Deployment & patrol board">
              <div className="resource-toolbar">
                <FilterBar query={query} setQuery={setQuery} placeholder="Filter site, guard, route, device…" />
                <span className="resource-toolbar-meta">{rows.length} shown</span>
              </div>
              <DataTable
                columns={[
                  {label: "Site", render: (row: AssignmentCard) => (
                    <>
                      <strong>{row.site_name}</strong>
                      <div className="table-subtle">{row.client_name}</div>
                    </>
                  )},
                  {label: "Guard", render: (row: AssignmentCard) => row.guard_name},
                  {label: "Shift", render: (row: AssignmentCard) => (
                    <>
                      {row.shift_name}
                      <div className="table-subtle">
                        {formatDate(row.shift_starts_at)} – {formatTime(row.shift_ends_at)}
                      </div>
                    </>
                  )},
                  {label: "Attendance", render: (row: AssignmentCard) => <StatusBadge value={row.attendance_status} />},
                  {label: "Patrol", render: (row: AssignmentCard) => <StatusBadge value={row.patrol_status} />},
                  {label: "Route", render: (row: AssignmentCard) => row.route_name ?? "—"},
                  {label: "Device", render: (row: AssignmentCard) => row.device_name ?? "—"},
                ]}
                rows={rows}
                emptyMessage="No assignments match the filter."
              />
            </Panel>

            <Panel title="Open exceptions" compact>
              <div className="stack-list">
                {exceptionRows.length ? (
                  exceptionRows.map((exception) => (
                    <article key={exception.id} className="stack-item">
                      <div>
                        <strong>{humanize(exception.exception_type)}</strong>
                        <div className="table-subtle">
                          {exception.site_name} · {exception.guard_name}
                        </div>
                      </div>
                      <StatusBadge value={exception.status} />
                    </article>
                  ))
                ) : (
                  <EmptyState message="No open exceptions." compact />
                )}
              </div>
            </Panel>
          </section>
        </div>
      ) : null}
      {activeTab === "records" ? <ResourceCrudPage context={context} configKey="patrolRecords" nested /> : null}
      {activeTab === "exceptions" ? <ResourceCrudPage context={context} configKey="patrolExceptions" nested /> : null}
    </TabbedPage>
  );
}
