import React from "react";

export function TabbedPage<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  tabs: Array<{key: T; label: string}>;
  activeTab: T;
  onTabChange: (key: T) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="page-stack">
      <div className="tab-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab-bar-item ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel">{children}</div>
    </div>
  );
}

export function SplitGrid({children}: {children: React.ReactNode}) {
  return <div className="split-grid">{children}</div>;
}

export function FormField({
  label,
  children,
  hint,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={`form-field ${fullWidth ? "full-span" : ""}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
