import React from "react";
import { AssignmentCard } from "../../api";
import { formatDate, humanize } from "../../lib/format";
import { PageContext } from "../../types/ui";
import { DataTable, EmptyState, KpiStrip, Panel, StatusBadge, SummaryStat } from "../../components/ui";

export function DashboardPage({context}: {context: PageContext}) {
  const {overview, summary, setupData, navigate} = context;

  const kpis = overview
    ? [
        {label: "On duty", value: overview.metrics.guards_on_duty},
        {label: "Absent", value: overview.metrics.absent_guards, alert: overview.metrics.absent_guards > 0},
        {label: "Late", value: overview.metrics.late_guards, alert: overview.metrics.late_guards > 0},
        {label: "Missed patrols", value: overview.metrics.missed_patrols, alert: overview.metrics.missed_patrols > 0},
        {label: "Incidents", value: overview.metrics.open_incidents, alert: overview.metrics.open_incidents > 0},
        {label: "Device flags", value: overview.metrics.faulty_devices, alert: overview.metrics.faulty_devices > 0},
      ]
    : [];

  const boardRows = (overview?.assignment_board ?? []).slice(0, 8);
  const incidentRows = (overview?.incidents ?? []).slice(0, 5);
  const exceptionRows = (overview?.patrol_exceptions ?? []).slice(0, 5);

  return (
    <div className="page-stack">
      <KpiStrip items={kpis} />

      {summary ? (
        <div className="footprint-strip">
          <span>Clients <strong>{summary.clients}</strong></span>
          <span>Sites <strong>{summary.sites}</strong></span>
          <span>Guards <strong>{summary.guards}</strong></span>
          <span>Routes <strong>{summary.patrol_routes}</strong></span>
          <span>Devices <strong>{summary.devices}</strong></span>
          <span>Records <strong>{summary.patrol_records}</strong></span>
        </div>
      ) : null}

      <section className="dashboard-grid">
        <Panel
          title="Live assignments"
          action={
            <button type="button" className="inline-link" onClick={() => navigate("patrol/monitoring")}>
              Monitoring
            </button>
          }
        >
          <DataTable
            columns={[
              {label: "Site", render: (row: AssignmentCard) => <strong>{row.site_name}</strong>},
              {label: "Guard", render: (row: AssignmentCard) => row.guard_name},
              {label: "Shift", render: (row: AssignmentCard) => (
                <>
                  {row.shift_name}
                  <div className="table-subtle">{formatDate(row.shift_starts_at)}</div>
                </>
              )},
              {label: "Attendance", render: (row: AssignmentCard) => <StatusBadge value={row.attendance_status} />},
              {label: "Patrol", render: (row: AssignmentCard) => <StatusBadge value={row.patrol_status} />},
            ]}
            rows={boardRows}
            emptyMessage="No active assignments."
          />
        </Panel>

        <div className="page-stack">
          <Panel
            title="Patrol exceptions"
            compact
            action={
              <button type="button" className="inline-link" onClick={() => navigate("patrol/monitoring")}>
                All
              </button>
            }
          >
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

          <Panel
            title="Incidents"
            compact
            action={
              <button type="button" className="inline-link" onClick={() => navigate("incidents/center")}>
                All
              </button>
            }
          >
            <div className="stack-list">
              {incidentRows.length ? (
                incidentRows.map((incident) => (
                  <article key={incident.id} className="stack-item">
                    <div>
                      <strong>{incident.title}</strong>
                      <div className="table-subtle">
                        {incident.site_name} · {formatDate(incident.occurred_at)}
                      </div>
                    </div>
                    <StatusBadge value={incident.severity} />
                  </article>
                ))
              ) : (
                <EmptyState message="No open incidents." compact />
              )}
            </div>
          </Panel>

          <Panel title="Platform counts" compact>
            <div className="summary-grid">
              <SummaryStat label="Shifts" value={summary?.shifts ?? 0} />
              <SummaryStat label="Assignments" value={summary?.assignments ?? 0} />
              <SummaryStat label="Reports" value={setupData?.reports.length ?? 0} />
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
