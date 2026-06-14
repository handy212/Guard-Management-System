import React, { useEffect, useState } from "react";
import { login, logout, fetchCurrentUser, fetchDashboardSummary, fetchOperationsOverview, fetchSetupData, fetchSupportData, downloadReport } from "./api";
import { AppSidebar, WorkspaceHeader } from "./components/layout";
import { getRouteFromHash, isCreateRoute, setHashRoute } from "./lib/routing";
import { getPageMeta, renderRoute } from "./pages";
import { PageContext, RouteKey } from "./types/ui";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem("guard_admin_token") ?? "");
  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash());
  const [user, setUser] = useState<PageContext["user"]>(null);
  const [overview, setOverview] = useState<PageContext["overview"]>(null);
  const [summary, setSummary] = useState<PageContext["summary"]>(null);
  const [setupData, setSetupData] = useState<PageContext["setupData"]>(null);
  const [supportData, setSupportData] = useState<PageContext["supportData"]>(null);
  const [loginForm, setLoginForm] = useState({username: "admin", password: "ChangeMe123!"});
  const [loginError, setLoginError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
    localStorage.setItem("guard_admin_token", token);
    refreshAll(token).catch(() => undefined);
  }, [token]);

  async function refreshAll(activeToken = token) {
    if (!activeToken) {
      return;
    }
    setIsLoading(true);
    try {
      const [currentUser, nextSummary, operations, nextSetupData, nextSupportData] = await Promise.all([
        fetchCurrentUser(activeToken),
        fetchDashboardSummary(activeToken),
        fetchOperationsOverview(activeToken),
        fetchSetupData(activeToken),
        fetchSupportData(activeToken),
      ]);
      setUser(currentUser);
      setSummary(nextSummary);
      setOverview(operations);
      setSetupData(nextSetupData);
      setSupportData(nextSupportData);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
      setToken("");
      setUser(null);
      setOverview(null);
      setSummary(null);
      setSetupData(null);
      setSupportData(null);
      localStorage.removeItem("guard_admin_token");
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
      setUser(response.user);
      setToken(response.token);
      setHashRoute("dashboard");
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
    setUser(null);
    setOverview(null);
    setSummary(null);
    setSetupData(null);
    setSupportData(null);
    localStorage.removeItem("guard_admin_token");
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string, afterSuccess?: () => void) {
    if (!token) {
      return;
    }
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      await action();
      afterSuccess?.();
      setMessage(successMessage);
      await refreshAll(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReportDownload(reportId: number, format: "csv" | "json") {
    if (!token) {
      return;
    }
    setError("");
    try {
      await downloadReport(reportId, format, token);
      setMessage(`Report ${reportId} exported as ${format.toUpperCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  function navigate(nextRoute: RouteKey) {
    setHashRoute(nextRoute);
    setMessage("");
  }

  if (!token) {
    return (
      <main className="login-shell">
        <section className="login-hero">
          <div className="eyebrow">Enterprise Guard Management</div>
          <h1>Compact operations control for sites, patrols, incidents, and reporting.</h1>
          <p className="login-copy">
            Built for staffing-heavy teams that need clear deployment status, dependable patrol visibility, and a clean
            command surface without dashboard clutter.
          </p>
          <div className="login-points">
            <div className="mini-stat"><strong>Live</strong><span>Patrol monitoring</span></div>
            <div className="mini-stat"><strong>Dense</strong><span>Table-first views</span></div>
            <div className="mini-stat"><strong>Secure</strong><span>Token-based internal access</span></div>
          </div>
        </section>
        <form className="login-panel" onSubmit={handleLogin}>
          <p className="eyebrow">Admin Sign In</p>
          <h2>Operations Console</h2>
          <label>
            Username
            <input value={loginForm.username} onChange={(event) => setLoginForm({...loginForm, username: event.target.value})} autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({...loginForm, password: event.target.value})} autoComplete="current-password" />
          </label>
          {loginError ? <div className="error-banner">{loginError}</div> : null}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
          <p className="helper-copy">Use the seeded internal admin account in local development.</p>
        </form>
      </main>
    );
  }

  const { currentNavItem } = getPageMeta(route);
  const context: PageContext = {
    user,
    overview,
    summary,
    setupData,
    supportData,
    token,
    message,
    error,
    isSubmitting,
    isLoading,
    navigate,
    refreshAll,
    handleLogout,
    runAction,
    onReportDownload: handleReportDownload,
  };

  return (
    <div className="app-layout">
      <AppSidebar route={route} navigate={navigate} />
      <main className="workspace">
        <WorkspaceHeader
          route={route}
          contextSummary={null}
          isCreatePage={isCreateRoute(route)}
          onRefresh={() => { void refreshAll(); }}
          onLogout={() => { void handleLogout(); }}
          onAction={() => {
            if (currentNavItem.actionRoute) {
              navigate(currentNavItem.actionRoute);
            }
          }}
          isLoading={isLoading}
        />

        {error ? <div className="error-banner">{error}</div> : null}
        {message ? <div className="success-banner">{message}</div> : null}

        {renderRoute(route, context)}
      </main>
    </div>
  );
}
