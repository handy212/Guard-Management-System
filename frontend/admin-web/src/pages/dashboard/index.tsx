import React from "react";
import { AlertTriangle, CalendarClock, RadioTower, ShieldAlert, Siren, UserCheck } from "lucide-react";
import { AssignmentCard } from "../../api";
import { FLOW_STEPS } from "../../navigation/config";
import { formatDate, humanize } from "../../lib/format";
import { PageContext } from "../../types/ui";
import { DataTable, EmptyState, Panel, StatusBadge, SummaryStat } from "../../components/ui";

export function DashboardPage({context}: {context: PageContext}) {
  const {overview, summary, setupData, navigate} = context;
  const metrics = overview
    ? [
        {label: "Guards on duty", value: overview.metrics.guards_on_duty, icon: UserCheck},
        {label: "Absent guards", value: overview.metrics.absent_guards, icon: AlertTriangle},
        {label: "Late guards", value: overview.metrics.late_guards, icon: CalendarClock},
        {label: "Missed patrols", value: overview.metrics.missed_patrols, icon: ShieldAlert},
        {label: "Open incidents", value: overview.metrics.open_incidents, icon: Siren},
        {label: "Flagged devices", value: overview.metrics.faulty_devices, icon: RadioTower},
      ]
    : [];

  const boardRows = (overview?.assignment_board ?? []).slice(0, 6);
  const incidentRows = (overview?.incidents ?? []).slice(0, 4);
  const reviewRows = (overview?.supervisor_reviews ?? []).slice(0, 4);
  const siteRows = (overview?.site_performance ?? []).slice(0, 4);

  return (
    <div className="page-stack">
      <section className="dashboard-title-row">
        <div>
          <h2 className="dashboard-heading">Dashboard</h2>
          <p className="subtle">Operations performance at a glance</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate("patrol/monitoring")}>
          Open monitoring
        </button>
      </section>

      <section className="flow-strip">
        {FLOW_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <article key={step.key} className="flow-card">
              <span className="flow-icon">
                <Icon size={16} />
              </span>
              <div>
                <span>{step.label}</span>
                <strong>{overview?.flow[step.key] ?? 0}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="metric-grid metric-grid-compact">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="metric-card">
              <span className="metric-icon">
                <Icon size={18} />
              </span>
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <Panel eyebrow="Operations" title="Workload by operational status" action={<button type="button" className="inline-link" onClick={() => navigate("reports")}>Operations report</button>}>
        <div className="status-pill-row">
          <span className="status-tag status-tag-accent">Open incidents {overview?.metrics.open_incidents ?? 0}</span>
          <span className="status-tag">Missed patrols {overview?.metrics.missed_patrols ?? 0}</span>
          <span className="status-tag">Flagged devices {overview?.metrics.faulty_devices ?? 0}</span>
          <span className="status-tag">Late guards {overview?.metrics.late_guards ?? 0}</span>
        </div>
      </Panel>

      <section className="dashboard-grid">
        <Panel eyebrow="Deployment" title="Active monitoring board" action={<button type="button" className="inline-link" onClick={() => navigate("patrol/monitoring")}>View all</button>}>
          <DataTable
            columns={[
              {label: "Site", render: (row: AssignmentCard) => <strong>{row.site_name}</strong>},
              {label: "Guard", render: (row: AssignmentCard) => row.guard_name},
              {label: "Shift", render: (row: AssignmentCard) => <>{row.shift_name}<div className="table-subtle">{formatDate(row.shift_starts_at)}</div></>},
              {label: "Attendance", render: (row: AssignmentCard) => <StatusBadge value={row.attendance_status} />},
              {label: "Patrol", render: (row: AssignmentCard) => <StatusBadge value={row.patrol_status} />},
              {label: "Device", render: (row: AssignmentCard) => row.device_name ?? "Unassigned"},
            ]}
            rows={boardRows}
            emptyMessage="No active assignments are available."
          />
        </Panel>

        <Panel eyebrow="Supervision" title="Recent inspections" action={<button type="button" className="inline-link" onClick={() => navigate("incidents/inspections")}>View all</button>}>
          <div className="stack-list">
            {reviewRows.length ? reviewRows.map((review) => (
              <article key={review.id} className="stack-item">
                <div>
                  <strong>{review.site_name}</strong>
                  <div className="table-subtle">{formatDate(review.inspected_at)}</div>
                </div>
                <StatusBadge value={review.status} />
              </article>
            )) : <EmptyState message="No inspection records are available." compact />}
          </div>
        </Panel>

        <Panel eyebrow="Exceptions" title="Patrol exceptions" action={<button type="button" className="inline-link" onClick={() => navigate("patrol/monitoring")}>View all</button>}>
          <div className="stack-list">
            {overview?.patrol_exceptions.length ? overview.patrol_exceptions.slice(0, 4).map((exception) => (
              <article key={exception.id} className="stack-item">
                <div>
                  <strong>{humanize(exception.exception_type)}</strong>
                  <div className="table-subtle">{exception.site_name} · {exception.guard_name}</div>
                </div>
                <StatusBadge value={exception.status} detail={exception.checkpoint_name ?? "Checkpoint missing"} />
              </article>
            )) : <EmptyState message="No patrol exceptions are open." compact />}
          </div>
        </Panel>

        <Panel eyebrow="Incidents" title="Operational watchlist" action={<button type="button" className="inline-link" onClick={() => navigate("incidents/center")}>View all</button>}>
          <div className="stack-list">
            {incidentRows.length ? incidentRows.map((incident) => (
              <article key={incident.id} className="stack-item">
                <div>
                  <strong>{incident.title}</strong>
                  <div className="table-subtle">{incident.site_name} · {formatDate(incident.occurred_at)}</div>
                </div>
                <StatusBadge value={incident.severity} />
              </article>
            )) : <EmptyState message="No incidents currently need attention." compact />}
          </div>
        </Panel>

        <Panel eyebrow="Readiness" title="Site coverage">
          <div className="stack-list">
            {siteRows.length ? siteRows.map((site) => (
              <article key={site.id} className="stack-item">
                <div>
                  <strong>{site.site_name}</strong>
                  <div className="table-subtle">{site.client_name}</div>
                </div>
                <div className="stack-meta">
                  <span>{site.assigned_guards}/{site.required_guards} guards</span>
                  <span>{site.route_count} routes</span>
                  <span>{site.device_count} devices</span>
                </div>
              </article>
            )) : <EmptyState message="No active sites are available." compact />}
          </div>
        </Panel>

        <Panel eyebrow="Reports" title="Recent output" action={<button type="button" className="inline-link" onClick={() => navigate("reports")}>View all</button>}>
          <div className="stack-list">
            {setupData?.reports.length ? setupData.reports.slice(0, 6).map((report) => (
              <article key={report.id} className="stack-item">
                <div>
                  <strong>{humanize(report.report_type)}</strong>
                  <div className="table-subtle">{formatDate(report.created_at)}</div>
                </div>
                <StatusBadge value={report.status} />
              </article>
            )) : <EmptyState message="No reports have been generated yet." compact />}
          </div>
        </Panel>

        <Panel eyebrow="Footprint" title="Platform summary">
          <div className="summary-grid">
            <SummaryStat label="Clients" value={summary?.clients ?? 0} />
            <SummaryStat label="Sites" value={summary?.sites ?? 0} />
            <SummaryStat label="Guards" value={summary?.guards ?? 0} />
            <SummaryStat label="Routes" value={summary?.patrol_routes ?? 0} />
            <SummaryStat label="Devices" value={summary?.devices ?? 0} />
            <SummaryStat label="Records" value={summary?.patrol_records ?? 0} />
          </div>
        </Panel>
      </section>
    </div>
  );
}
