import React from "react";
import { Moon, RefreshCw, Search, SunMedium } from "lucide-react";
import { groupNavItems } from "../navigation/config";
import { ThemeMode } from "../lib/theme";
import { RouteKey } from "../types/ui";

export function AppSidebar({
  route,
  navigate,
  userName,
}: {
  route: RouteKey;
  navigate: (route: RouteKey) => void;
  userName?: string;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">G</div>
        <div className="brand-copy">
          <strong>GuardOps</strong>
          <span>Control room</span>
        </div>
      </div>

      {groupNavItems().map(([group, items]) => (
        <nav key={group} className="nav-group">
          <p className="nav-label">{group}</p>
          {items.map((item) => {
            const Icon = item.icon;
            const active = route === item.route || route.startsWith(`${item.route}/`);
            return (
              <button
                key={item.route}
                type="button"
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => navigate(item.route)}
              >
                <Icon size={15} />
                <span className="nav-item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      ))}

      {userName ? (
        <div className="sidebar-user">
          <span className="sidebar-user-dot" />
          <span className="sidebar-user-name">{userName}</span>
        </div>
      ) : null}
    </aside>
  );
}

function commandShortcutLabel() {
  if (typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform)) {
    return "⌘K";
  }
  return "Ctrl+K";
}

export function PageHeader({
  title,
  description,
  isLoading,
  theme,
  onOpenCommandPalette,
  onToggleTheme,
  onRefresh,
  onLogout,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  theme: ThemeMode;
  onOpenCommandPalette: () => void;
  onToggleTheme: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <h1>{title}</h1>
        <p className="subtle">{description}</p>
      </div>
      <div className="page-header-actions">
        <button type="button" className="ghost-button command-trigger" onClick={onOpenCommandPalette}>
          <Search size={14} />
          Search
          <kbd className="command-kbd">{commandShortcutLabel()}</kbd>
        </button>
        <button type="button" className="ghost-button icon-button" onClick={onToggleTheme} title="Toggle theme">
          {theme === "dark" ? <SunMedium size={14} /> : <Moon size={14} />}
        </button>
        <button type="button" className="ghost-button" onClick={onRefresh} disabled={isLoading} title="Refresh data">
          <RefreshCw size={14} className={isLoading ? "spin" : undefined} />
          {isLoading ? "Syncing" : "Refresh"}
        </button>
        <button type="button" className="ghost-button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
