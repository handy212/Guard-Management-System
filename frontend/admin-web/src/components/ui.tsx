import React from "react";
import { GenericRecord } from "../api";
import { STATUS_TONES } from "../navigation/config";
import { Column } from "../types/ui";
import { formatUnknown, humanize } from "../lib/format";

export function FilterBar({
  query,
  setQuery,
  placeholder,
  helper,
}: {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  helper: string;
}) {
  return (
    <section className="filter-bar">
      <div className="filter-bar-main">
        <div className="filter-input-wrap">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} />
        </div>
        <p className="subtle">{helper}</p>
      </div>
    </section>
  );
}

export function Panel({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DataTable<T>({
  columns,
  rows,
  emptyMessage,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage: string;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.label}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index} className="data-row">
                {columns.map((column) => <td key={column.label} className={column.className}>{column.render(row)}</td>)}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-cell">{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function EntityTable<T>({
  eyebrow,
  title,
  rows,
  columns,
  emptyMessage,
}: {
  eyebrow: string;
  title: string;
  rows: T[];
  columns: Column<T>[];
  emptyMessage: string;
}) {
  return (
    <Panel eyebrow={eyebrow} title={title}>
      <DataTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
    </Panel>
  );
}

export function GenericRecordTable({
  eyebrow,
  title,
  rows,
  emptyMessage,
  fields,
  nested,
}: {
  eyebrow: string;
  title: string;
  rows: GenericRecord[];
  emptyMessage: string;
  fields: string[];
  nested?: boolean;
}) {
  const columns = fields.map((field) => ({
    label: humanize(field),
    render: (row: GenericRecord) => formatUnknown(row[field]),
  }));

  return nested
    ? <DataTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
    : <EntityTable eyebrow={eyebrow} title={title} rows={rows} emptyMessage={emptyMessage} columns={columns} />;
}

export function StatusBadge({value, detail}: {value: string; detail?: string}) {
  const tone = STATUS_TONES[value] ?? "info";
  return (
    <span className={`status-pill status-${tone}`}>
      {humanize(value)}
      {detail ? <small>{detail}</small> : null}
    </span>
  );
}

export function SummaryStat({label, value}: {label: string; value: number}) {
  return (
    <article className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Live count</small>
    </article>
  );
}

export function EmptyState({message, compact}: {message: string; compact?: boolean}) {
  return <div className={`empty-state ${compact ? "compact" : ""}`}>{message}</div>;
}

export function SelectOptions({
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{value: string; label: string}>;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

export function FormActions({submitting, submitLabel}: {submitting: boolean; submitLabel: string}) {
  return (
    <div className="form-actions">
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

export function FormPage({
  title,
  eyebrow,
  onCancel,
  form,
}: {
  title: string;
  eyebrow: string;
  onCancel: () => void;
  form: React.ReactNode;
}) {
  return (
    <section className="form-shell">
      <div className="form-sidebar">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="subtle">This dedicated form page keeps dashboard and monitoring pages clean while preserving the existing create flows.</p>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Back to list
        </button>
      </div>
      <div className="form-panel">{form}</div>
    </section>
  );
}

export function SectionTabs({
  items,
  activeKey,
  onChange,
}: {
  items: Array<{key: string; label: string}>;
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="section-tabs" role="tablist" aria-label="Section tabs">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`section-tab ${activeKey === item.key ? "active" : ""}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
