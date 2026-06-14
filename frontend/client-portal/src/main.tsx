import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ClientPortalOverview,
  ComplaintInput,
  ReportRequestInput,
  createComplaint,
  fetchClientPortalOverview,
  formatDate,
  humanize,
  login,
  logout,
  requestReport,
} from "./api";
import { applyTheme, getStoredTheme, toggleTheme, type ThemeMode } from "./lib/theme";
import "./styles.css";

type PortalTab = "overview" | "reports" | "actions";

applyTheme(getStoredTheme());

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("guard_client_token") ?? "");
  const [overview, setOverview] = useState<ClientPortalOverview | null>(null);
  const [loginForm, setLoginForm] = useState({username: "client", password: "ClientPass123!"});
  const [complaintForm, setComplaintForm] = useState<ComplaintInput>({title: "", description: ""});
  const [reportForm, setReportForm] = useState<ReportRequestInput>({report_type: "client_service"});
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [loginError, setLoginError] = useState("");
  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplaintSubmitting, setIsComplaintSubmitting] = useState(false);
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  const siteOptions = overview?.sites ?? [];
  const selectedReport = useMemo(
    () => overview?.reports.find((report) => report.id === selectedReportId) ?? overview?.reports[0] ?? null,
    [overview, selectedReportId],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    localStorage.setItem("guard_client_token", token);
    refreshOverview(token);
  }, [token]);

  async function refreshOverview(activeToken = token) {
    if (!activeToken) {
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchClientPortalOverview(activeToken);
      setOverview(data);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Refresh failed";
      setError(message);
      if (activeToken === token) {
        setToken("");
        localStorage.removeItem("guard_client_token");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError("");
    try {
      const response = await login(loginForm.username, loginForm.password);
      setToken(response.token);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    if (token) {
      await logout(token).catch(() => undefined);
    }
    setToken("");
    setOverview(null);
    localStorage.removeItem("guard_client_token");
  }

  function handleToggleTheme() {
    setTheme(toggleTheme());
  }

  async function handleComplaintSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }
    setIsComplaintSubmitting(true);
    setFormMessage("");
    setError("");
    try {
      await createComplaint(complaintForm, token);
      setComplaintForm({title: "", description: "", site: complaintForm.site});
      setFormMessage("Complaint submitted.");
      await refreshOverview(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Complaint submission failed");
    } finally {
      setIsComplaintSubmitting(false);
    }
  }

  async function handleReportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }
    setIsReportSubmitting(true);
    setFormMessage("");
    setError("");
    try {
      const report = await requestReport(reportForm, token);
      setFormMessage("Report request generated.");
      setSelectedReportId(report.id);
      await refreshOverview(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report request failed");
    } finally {
      setIsReportSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="login-shell">
        <form className="login-panel" onSubmit={handleLogin}>
          <p className="eyebrow">Client portal</p>
          <h1>Service dashboard</h1>
          <p className="subtle">View patrol proof, incidents, and reports for your sites.</p>
          <label>
            Username
            <input
              value={loginForm.username}
              onChange={(event) => setLoginForm({...loginForm, username: event.target.value})}
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({...loginForm, password: event.target.value})}
              autoComplete="current-password"
            />
          </label>
          {loginError ? <div className="error-banner">{loginError}</div> : null}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  const kpis = overview
    ? [
        {label: "Sites", value: overview.metrics.sites},
        {label: "Assignments", value: overview.metrics.assignments},
        {label: "Patrol records", value: overview.metrics.patrol_records},
        {label: "Incidents", value: overview.metrics.open_incidents},
        {label: "Complaints", value: overview.metrics.open_complaints},
        {label: "Shifts", value: overview.metrics.scheduled_shifts},
      ]
    : [];

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <div>
          <p className="eyebrow">{overview?.client.code ?? "Client"}</p>
          <h1>{overview?.client.name ?? "Client portal"}</h1>
          <p className="subtle">Attendance, patrol activity, incidents, and service reports.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={handleToggleTheme} title="Toggle theme">
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button type="button" className="ghost-button" onClick={() => refreshOverview()} disabled={isLoading}>
            {isLoading ? "Syncing…" : "Refresh"}
          </button>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {formMessage ? <div className="success-banner">{formMessage}</div> : null}

      <nav className="portal-tab-bar" aria-label="Portal sections">
        {(
          [
            {key: "overview", label: "Overview"},
            {key: "reports", label: "Reports"},
            {key: "actions", label: "Actions"},
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`portal-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <div className="portal-tab-panel">
          <section className="kpi-strip">
            {kpis.map((metric) => (
              <article key={metric.label} className="kpi-cell">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </section>

          <section className="site-strip">
            {overview?.sites.map((site) => (
              <article key={site.id} className="site-card">
                <div>
                  <h2>{site.name}</h2>
                  <p>{site.address || "Address not provided"}</p>
                </div>
                <div className="site-meta">
                  <span>{site.assigned_guards}/{site.required_guards} guards</span>
                  <span>{site.route_count} routes</span>
                  <span>{site.device_count} devices</span>
                  <span>{site.open_incident_count} incidents</span>
                </div>
              </article>
            ))}
          </section>

          <section className="content-grid overview-grid">
            <section className="panel">
              <div className="panel-header">
                <h2>Attendance & deployments</h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Guard</th>
                      <th>Shift</th>
                      <th>Attendance</th>
                      <th>Patrol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview?.attendance_and_deployments.length ? (
                      overview.attendance_and_deployments.map((item) => (
                        <tr key={item.id}>
                          <td>{item.site_name}</td>
                          <td>{item.guard_name}</td>
                          <td>
                            <strong>{item.shift_name}</strong>
                            <div className="table-subtle">{formatDate(item.shift_starts_at)}</div>
                          </td>
                          <td>
                            <span className={`status-pill status-${item.attendance_status}`}>{humanize(item.attendance_status)}</span>
                          </td>
                          <td>
                            <span className={`status-pill status-${item.patrol_status}`}>{humanize(item.patrol_status)}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-cell">
                          No deployment records yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Patrol exceptions</h2>
              </div>
              <div className="stack-list">
                {overview?.patrol_exceptions.length ? (
                  overview.patrol_exceptions.map((exception) => (
                    <article key={exception.id} className="stack-item">
                      <div>
                        <strong>{humanize(exception.exception_type)}</strong>
                        <div className="table-subtle">
                          {exception.site_name} · {exception.guard_name}
                        </div>
                      </div>
                      <span className="status-pill status-open">{exception.checkpoint_name ?? "Checkpoint missing"}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No patrol exceptions.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Incidents</h2>
              </div>
              <div className="stack-list">
                {overview?.incidents.length ? (
                  overview.incidents.map((incident) => (
                    <article key={incident.id} className="stack-item">
                      <div>
                        <strong>{incident.title}</strong>
                        <div className="table-subtle">{incident.site_name}</div>
                      </div>
                      <span className={`status-pill status-${incident.severity}`}>{humanize(incident.severity)}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No incidents reported.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Inspections</h2>
              </div>
              <div className="stack-list">
                {overview?.supervisor_inspections.length ? (
                  overview.supervisor_inspections.map((inspection) => (
                    <article key={inspection.id} className="stack-item">
                      <div>
                        <strong>{inspection.site_name}</strong>
                        <div className="table-subtle">{formatDate(inspection.inspected_at)}</div>
                      </div>
                      <span className={`status-pill status-${inspection.status}`}>{humanize(inspection.status)}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No inspection records.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Complaints</h2>
              </div>
              <div className="stack-list">
                {overview?.complaints.length ? (
                  overview.complaints.map((complaint) => (
                    <article key={complaint.id} className="stack-item">
                      <div>
                        <strong>{complaint.title}</strong>
                        <div className="table-subtle">{formatDate(complaint.created_at)}</div>
                      </div>
                      <span className={`status-pill status-${complaint.status}`}>{humanize(complaint.status)}</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">No complaints logged.</div>
                )}
              </div>
            </section>
          </section>
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <div className="portal-tab-panel">
          <section className="content-grid reports-grid">
            <section className="panel">
              <div className="panel-header">
                <h2>Generated reports</h2>
              </div>
              <div className="stack-list">
                {overview?.reports.length ? (
                  overview.reports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      className={`stack-item selectable ${selectedReport?.id === report.id ? "selected" : ""}`}
                      onClick={() => setSelectedReportId(report.id)}
                    >
                      <div>
                        <strong>{humanize(report.report_type)}</strong>
                        <div className="table-subtle">{formatDate(report.created_at)}</div>
                      </div>
                      <span className={`status-pill status-${report.status}`}>{humanize(report.status)}</span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">No generated reports.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Report summary</h2>
              </div>
              {selectedReport?.summary ? (
                <div className="summary-card">
                  <div className="summary-grid">
                    {Object.entries(selectedReport.summary.totals).map(([key, value]) => (
                      <article key={key}>
                        <span>{humanize(key)}</span>
                        <strong>{value}</strong>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">Select a report to view totals.</div>
              )}
            </section>
          </section>
        </div>
      ) : null}

      {activeTab === "actions" ? (
        <div className="portal-tab-panel">
          <section className="content-grid actions-grid">
            <section className="panel">
              <div className="panel-header">
                <h2>Raise complaint</h2>
              </div>
              <form className="action-form" onSubmit={handleComplaintSubmit}>
                <label>
                  Site
                  <select
                    value={complaintForm.site ?? ""}
                    onChange={(event) => setComplaintForm({...complaintForm, site: event.target.value ? Number(event.target.value) : undefined})}
                  >
                    <option value="">All sites</option>
                    {siteOptions.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Title
                  <input
                    value={complaintForm.title}
                    onChange={(event) => setComplaintForm({...complaintForm, title: event.target.value})}
                    required
                  />
                </label>
                <label>
                  Details
                  <textarea
                    value={complaintForm.description}
                    onChange={(event) => setComplaintForm({...complaintForm, description: event.target.value})}
                    required
                  />
                </label>
                <button type="submit" className="primary-button" disabled={isComplaintSubmitting}>
                  {isComplaintSubmitting ? "Submitting..." : "Submit complaint"}
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Request report</h2>
              </div>
              <form className="action-form" onSubmit={handleReportSubmit}>
                <label>
                  Site
                  <select
                    value={reportForm.site ?? ""}
                    onChange={(event) => setReportForm({...reportForm, site: event.target.value ? Number(event.target.value) : undefined})}
                  >
                    <option value="">All sites</option>
                    {siteOptions.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Report type
                  <select
                    value={reportForm.report_type}
                    onChange={(event) => setReportForm({...reportForm, report_type: event.target.value})}
                  >
                    <option value="client_service">Client Service</option>
                    <option value="daily_attendance">Daily Attendance</option>
                    <option value="patrol_completion">Patrol Completion</option>
                    <option value="missed_checkpoint">Missed Checkpoint</option>
                    <option value="incident">Incident</option>
                    <option value="supervisor_inspection">Supervisor Inspection</option>
                    <option value="site_performance">Site Performance</option>
                  </select>
                </label>
                <label>
                  Date from
                  <input
                    type="date"
                    value={reportForm.date_from ?? ""}
                    onChange={(event) => setReportForm({...reportForm, date_from: event.target.value || undefined})}
                  />
                </label>
                <label>
                  Date to
                  <input
                    type="date"
                    value={reportForm.date_to ?? ""}
                    onChange={(event) => setReportForm({...reportForm, date_to: event.target.value || undefined})}
                  />
                </label>
                <button type="submit" className="primary-button" disabled={isReportSubmitting}>
                  {isReportSubmitting ? "Generating..." : "Generate report"}
                </button>
              </form>
            </section>
          </section>
        </div>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
