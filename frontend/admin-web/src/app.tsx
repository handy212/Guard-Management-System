import React, { useCallback, useEffect, useState } from "react";
import { login, logout, fetchCurrentUser, fetchDashboardSummary, fetchOperationsOverview, fetchSetupData, fetchSupportData, downloadReport } from "./api";
import { AppSidebar, PageHeader } from "./components/layout";
import { CommandPalette, useCommandPaletteShortcut } from "./components/command-palette";
import { getRouteFromHash, setHashRoute } from "./lib/routing";
import { getStoredTheme, toggleTheme, type ThemeMode } from "./lib/theme";
import { getPageMeta, renderRoute } from "./pages";
import { PageContext, RecordFocus, RouteKey } from "./types/ui";

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
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandPaletteKey, setCommandPaletteKey] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [recordFocus, setRecordFocus] = useState<RecordFocus | null>(null);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteKey((key) => key + 1);
    setCommandOpen(true);
  }, []);
  useCommandPaletteShortcut(openCommandPalette);

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

  function navigate(nextRoute: RouteKey, focus: RecordFocus | null = null) {
    setHashRoute(nextRoute);
    setRoute(nextRoute);
    setRecordFocus(focus);
    setMessage("");
  }

  function clearRecordFocus() {
    setRecordFocus(null);
  }

  function handleToggleTheme() {
    setTheme(toggleTheme());
  }

  if (!token) {
    return (
      <main className="login-shell">
        <form className="login-panel" onSubmit={handleLogin}>
          <p className="eyebrow">Internal access</p>
          <h2>GuardOps Console</h2>
          <p className="subtle">Sign in to manage sites, patrols, incidents, and reports.</p>
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  const {pageTitle, pageDescription} = getPageMeta(route);
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
    recordFocus,
    clearRecordFocus,
    refreshAll,
    handleLogout,
    runAction,
    onReportDownload: handleReportDownload,
  };

  return (
    <div className="app-layout">
      <AppSidebar route={route} navigate={navigate} userName={user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.username} />
      <main className="workspace">
        <PageHeader
          title={pageTitle}
          description={pageDescription}
          theme={theme}
          onOpenCommandPalette={openCommandPalette}
          onToggleTheme={handleToggleTheme}
          onRefresh={() => { void refreshAll(); }}
          onLogout={() => { void handleLogout(); }}
          isLoading={isLoading}
        />

        <CommandPalette
          key={commandPaletteKey}
          open={commandOpen}
          onClose={() => setCommandOpen(false)}
          context={context}
          onNavigate={navigate}
        />

        {error ? <div className="error-banner">{error}</div> : null}
        {message ? <div className="success-banner">{message}</div> : null}

        {renderRoute(route, context)}
      </main>
    </div>
  );
}
