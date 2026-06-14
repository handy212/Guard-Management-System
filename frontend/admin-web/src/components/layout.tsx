import React from "react";
import { Bell, ChevronRight, Plus, Search, Settings, Sidebar, SunMedium } from "lucide-react";
import { NAV_ITEMS, groupNavItems } from "../navigation/config";
import { RouteKey } from "../types/ui";

export function AppSidebar({
  route,
  navigate,
}: {
  route: RouteKey;
  navigate: (route: RouteKey) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <button type="button" className="sidebar-icon-button" aria-label="Collapse navigation">
          <Sidebar size={16} />
        </button>
        <div className="brand-block">
          <div className="brand-mark">GM</div>
          <div>
            <p className="eyebrow">Guard Console</p>
            <h2>Operations HQ</h2>
          </div>
        </div>
      </div>
      {groupNavItems().map(([group, items]) => (
        <nav key={group} className="nav-group">
          <p className="nav-label">{group}</p>
          {items.map((item) => {
            const Icon = item.icon;
            const active = route === item.route || route.startsWith(`${item.route}/`);
            return (
              <button key={item.route} type="button" className={`nav-item ${active ? "active" : ""}`} onClick={() => navigate(item.route)}>
                <Icon size={16} />
                <span className="nav-item-label">{item.label}</span>
                <ChevronRight size={14} />
              </button>
            );
          })}
        </nav>
      ))}
      <div className="sidebar-help">
        <span className="sidebar-help-label">Internal support</span>
        <strong>Operations and compliance workspace</strong>
      </div>
    </aside>
  );
}

export function WorkspaceHeader({
  route,
  contextSummary,
  isCreatePage,
  onRefresh,
  onLogout,
  onAction,
  isLoading,
}: {
  route: RouteKey;
  contextSummary: React.ReactNode;
  isCreatePage: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onAction: () => void;
  isLoading: boolean;
}) {
  const currentNavItem = NAV_ITEMS.find((item) => route === item.route || route.startsWith(`${item.route}/`));

  return (
    <section className="workspace-shell-header">
      <div className="utilitybar">
        <div className="utilitybar-company">
          <div className="brand-mark small">GM</div>
          <strong>Guard Management System</strong>
        </div>
        <div className="utilitybar-search">
          <Search size={16} />
          <input type="text" value="" readOnly placeholder="Search modules, records, or sites..." aria-label="Global search" />
          <span className="search-shortcut">CTRL K</span>
        </div>
        <div className="utilitybar-actions">
          <button type="button" className="toolbar-icon-button" aria-label="Create quick action">
            <Plus size={16} />
          </button>
          <button type="button" className="toolbar-icon-button" aria-label="Notifications">
            <Bell size={16} />
          </button>
          <button type="button" className="toolbar-icon-button" aria-label="Appearance">
            <SunMedium size={16} />
          </button>
          <button type="button" className="toolbar-icon-button" aria-label="Preferences">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <header className="topbar">
        <div className="topbar-actions">
          <span className="workspace-badge">{currentNavItem?.group ?? "Workspace"}</span>
          <span className="topbar-status">{isLoading ? "Refreshing now" : "Live workspace"}</span>
          {currentNavItem?.actionRoute && !isCreatePage ? (
            <button type="button" className="primary-button" onClick={onAction}>
              {currentNavItem.actionLabel ?? "Create"}
            </button>
          ) : null}
          <button type="button" className="secondary-button" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="secondary-button" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>
      {contextSummary ? <div className="context-strip">{contextSummary}</div> : null}
    </section>
  );
}
