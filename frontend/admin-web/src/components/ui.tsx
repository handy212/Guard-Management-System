import React from "react";
import { GenericRecord } from "../api";
import { STATUS_TONES } from "../navigation/config";
import { Column } from "../types/ui";
import { buildPaginationSummary, formatUnknown, humanize } from "../lib/format";

export function FilterBar({
  query,
  setQuery,
  placeholder,
}: {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  helper?: string;
}) {
  return (
    <div className="filter-inline">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

export function Panel({
  eyebrow,
  title,
  action,
  children,
  compact,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`panel ${compact ? "panel-compact" : ""}`}>
      <div className="panel-header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pagination-bar">
      <span className="subtle">{buildPaginationSummary(page, pageSize, total)}</span>
      <div className="inline-actions">
        <button type="button" className="ghost-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <span className="pagination-page">{page}/{totalPages}</span>
        <button type="button" className="ghost-button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function DataTable<T extends {id?: number | string}>({
  columns,
  rows,
  emptyMessage,
  highlightRowId,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage: string;
  highlightRowId?: number | string | null;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr
                key={row.id ?? index}
                className={`data-row ${highlightRowId != null && row.id === highlightRowId ? "data-row-focused" : ""}`}
              >
                {columns.map((column) => (
                  <td key={column.label} className={column.className}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function EntityTable<T extends {id?: number | string}>({
  eyebrow,
  title,
  rows,
  columns,
  emptyMessage,
}: {
  eyebrow?: string;
  title: string;
  rows: T[];
  columns: Column<T>[];
  emptyMessage: string;
}) {
  return (
    <Panel eyebrow={eyebrow} title={title} compact>
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
  eyebrow?: string;
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

  return nested ? (
    <DataTable columns={columns} rows={rows} emptyMessage={emptyMessage} />
  ) : (
    <EntityTable eyebrow={eyebrow} title={title} rows={rows} emptyMessage={emptyMessage} columns={columns} />
  );
}

export function StatusBadge({value, detail}: {value: string; detail?: string}) {
  const tone = STATUS_TONES[value] ?? "info";
  return (
    <span className={`status-pill status-${tone}`}>
      <span className="status-dot" />
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
    </article>
  );
}

export function KpiStrip({items}: {items: Array<{label: string; value: number; alert?: boolean}>}) {
  return (
    <section className="kpi-strip">
      {items.map((item) => (
        <article key={item.label} className={`kpi-cell ${item.alert ? "kpi-alert" : ""}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
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
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FormActions({submitting, submitLabel, onCancel}: {submitting: boolean; submitLabel: string; onCancel?: () => void}) {
  return (
    <div className="form-actions">
      {onCancel ? (
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
      ) : null}
      <button type="submit" className="primary-button" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

export function FormPage({
  title,
  onCancel,
  form,
}: {
  title: string;
  onCancel: () => void;
  form: React.ReactNode;
}) {
  return (
    <section className="compact-form-page">
      <div className="panel compact-form-card">
        <div className="panel-header">
          <h2>{title}</h2>
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div className="compact-form-body">{form}</div>
      </div>
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
    <div className="tab-bar" role="tablist" aria-label="Section tabs">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={activeKey === item.key}
          className={`tab-bar-item ${activeKey === item.key ? "active" : ""}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
