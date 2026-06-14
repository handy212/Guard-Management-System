import React, { useEffect, useMemo, useState } from "react";
import {
  APIError,
  createResource,
  deleteResource,
  fetchResourceList,
  GenericRecord,
  updateResource,
} from "../api";
import { CrudConfigKey, CrudFieldConfig, CrudResourceConfig, crudConfigs } from "../crud/config";
import { formatUnknown } from "../lib/format";
import { PageContext } from "../types/ui";
import { DataTable, FilterBar, Panel } from "./ui";

type FormStateValue = string | boolean | string[];
type FormState = Record<string, FormStateValue>;
type FieldErrors = Record<string, string>;

export function ResourceCrudPage({
  context,
  configKey,
  nested,
}: {
  context: PageContext;
  configKey: CrudConfigKey;
  nested?: boolean;
}) {
  const config: CrudResourceConfig = crudConfigs[configKey];
  const [rows, setRows] = useState<GenericRecord[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [currentRow, setCurrentRow] = useState<GenericRecord | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [localNotice, setLocalNotice] = useState("");

  useEffect(() => {
    void load();
  }, [context.token, config.endpoint]);

  async function load() {
    const nextRows = await fetchResourceList(config.endpoint, context.token);
    setRows(nextRows);
  }

  const filteredRows = useMemo(
    () => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );
  const formSections = useMemo(() => buildFormSections(config.fields), [config.fields]);
  const statusBreakdown = useMemo(() => buildStatusBreakdown(filteredRows), [filteredRows]);

  function openCreate() {
    setMode("create");
    setCurrentRow(null);
    setLocalError("");
    setFieldErrors({});
    setFormState(buildInitialFormState(config.fields, null));
  }

  function openEdit(row: GenericRecord) {
    setMode("edit");
    setCurrentRow(row);
    setLocalError("");
    setFieldErrors({});
    setFormState(buildInitialFormState(config.fields, row));
  }

  async function save() {
    try {
      setLocalError("");
      setFieldErrors({});
      setLocalNotice("");
      const payload = buildPayload(config.fields, formState);
      if (mode === "create") {
        await createResource(config.endpoint, payload, context.token);
        setLocalNotice(`${config.title} record created.`);
      } else if (mode === "edit" && currentRow?.id) {
        await updateResource(config.endpoint, Number(currentRow.id), payload, context.token);
        setLocalNotice(`${config.title} record updated.`);
      }
      setMode(null);
      setCurrentRow(null);
      await load();
      await context.refreshAll();
    } catch (error) {
      if (error instanceof APIError) {
        setLocalError(error.message);
        setFieldErrors(extractFieldErrors(error.details));
      } else {
        setLocalError(error instanceof Error ? error.message : "Save failed");
      }
    }
  }

  async function removeRow(row: GenericRecord) {
    if (!window.confirm(`Delete this ${config.title.toLowerCase()} record?`)) {
      return;
    }
    try {
      setLocalError("");
      setLocalNotice("");
      await deleteResource(config.endpoint, Number(row.id), context.token);
      setLocalNotice(`${config.title} record deleted.`);
      await load();
      await context.refreshAll();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Delete failed");
    }
  }

  const content = (
    <div className="page-stack">
      <FilterBar query={query} setQuery={setQuery} placeholder={`Search ${config.title.toLowerCase()}`} helper={config.helper} />
      <section className="resource-overview-strip">
        <article className="resource-overview-card">
          <span>Total records</span>
          <strong>{rows.length}</strong>
        </article>
        <article className="resource-overview-card">
          <span>Visible rows</span>
          <strong>{filteredRows.length}</strong>
        </article>
        {statusBreakdown.slice(0, 3).map((item) => (
          <article key={item.label} className="resource-overview-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>
      <Panel
        eyebrow={config.eyebrow}
        title={config.title}
        action={
          <div className="resource-panel-actions">
            <span className="resource-panel-meta">{filteredRows.length} rows</span>
            <button type="button" className="primary-button" onClick={openCreate}>{config.createLabel}</button>
          </div>
        }
      >
        {mode ? (
          <div className="crud-form-shell">
            <div className="crud-form-header">
              <div>
                <p className="eyebrow">{mode === "create" ? "Create" : "Edit"}</p>
                <h2>{mode === "create" ? config.createLabel : `Edit ${config.title}`}</h2>
                <p className="subtle">Use grouped sections to update operational details with less scrolling and cleaner field alignment.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setMode(null)}>Cancel</button>
            </div>
            {localNotice ? <div className="success-banner">{localNotice}</div> : null}
            {localError ? <div className="error-banner">{localError}</div> : null}
            <div className="crud-form-sections">
              {formSections.map((section) => (
                <section key={section.title} className="form-section">
                  <div className="form-section-header">
                    <h3>{section.title}</h3>
                    <span>{section.fields.length} fields</span>
                  </div>
                  <div className="form-grid form-grid-two-column">
                    {section.fields.map((field) => renderField(field, formState, setFormState, context, fieldErrors[field.name]))}
                  </div>
                </section>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="primary-button" onClick={() => void save()} disabled={context.isSubmitting}>
                {context.isSubmitting ? "Saving..." : mode === "create" ? config.createLabel : "Save Changes"}
              </button>
            </div>
          </div>
        ) : null}
        <DataTable
          columns={[
            ...config.columns.map((column) => ({
              label: column.label,
              render: (row: GenericRecord) => column.render(row, context),
            })),
            {
              label: "Actions",
              render: (row: GenericRecord) => (
                <div className="inline-actions table-actions">
                  {(config.rowActions ?? []).map((action) => (
                    <button key={action.label} type="button" className="table-action-button" onClick={() => void action.onClick(row, context)}>
                      {action.label}
                    </button>
                  ))}
                  <button type="button" className="table-action-button" onClick={() => openEdit(row)}>Edit</button>
                  <button type="button" className="table-action-button danger" onClick={() => void removeRow(row)}>Delete</button>
                </div>
              ),
            },
          ]}
          rows={filteredRows}
          emptyMessage={config.emptyMessage}
        />
      </Panel>
    </div>
  );

  return nested ? <>{content}</> : content;
}

function renderField(
  field: CrudFieldConfig,
  formState: FormState,
  setFormState: React.Dispatch<React.SetStateAction<FormState>>,
  context: PageContext,
  error?: string,
) {
  const key = field.name;
  const value = formState[key];
  const options = typeof field.options === "function" ? field.options(context) : field.options ?? [];
  const fullWidth = field.fullWidth || field.kind === "textarea" || field.kind === "json" || field.kind === "multiselect";
  const isCheckbox = field.kind === "checkbox";

  return (
    <label key={key} className={`form-field ${fullWidth ? "full-span" : ""} ${isCheckbox ? "checkbox-field" : ""}`}>
      <span className="field-label">{field.label}</span>
      {field.kind === "textarea" ? (
        <textarea
          rows={field.rows ?? 3}
          value={String(value ?? "")}
          onChange={(event) => setFormState((current) => ({...current, [key]: event.target.value}))}
        />
      ) : field.kind === "select" ? (
        <select value={String(value ?? "")} onChange={(event) => setFormState((current) => ({...current, [key]: event.target.value}))}>
          <option value="">{field.allowBlank ? "Optional" : "Select option"}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.kind === "multiselect" ? (
        <select
          multiple
          className="multi-select"
          value={Array.isArray(value) ? value : []}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              [key]: Array.from(event.target.selectedOptions).map((option) => option.value),
            }))
          }
        >
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.kind === "checkbox" ? (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => setFormState((current) => ({...current, [key]: event.target.checked}))}
        />
      ) : field.kind === "json" ? (
        <textarea
          rows={field.rows ?? 4}
          value={String(value ?? "")}
          onChange={(event) => setFormState((current) => ({...current, [key]: event.target.value}))}
          placeholder='{}'
        />
      ) : (
        <input
          type={inputTypeFor(field.kind)}
          value={formatInputValue(field.kind, value)}
          onChange={(event) => setFormState((current) => ({...current, [key]: event.target.value}))}
          required={field.required}
        />
      )}
      {field.description ? <span className="field-hint">{field.description}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

function buildFormSections(fields: CrudFieldConfig[]) {
  const sections = new Map<string, CrudFieldConfig[]>();
  for (const field of fields) {
    const title = field.section ?? "General";
    if (!sections.has(title)) {
      sections.set(title, []);
    }
    sections.get(title)!.push(field);
  }
  return Array.from(sections.entries()).map(([title, sectionFields]) => ({
    title,
    fields: sectionFields,
  }));
}

function buildStatusBreakdown(rows: GenericRecord[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const status = row.status ?? row.severity ?? row.kind ?? row.source;
    if (!status) {
      continue;
    }
    const key = formatUnknown(status);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({label, value}))
    .sort((left, right) => right.value - left.value);
}

function buildInitialFormState(fields: CrudFieldConfig[], row: GenericRecord | null): FormState {
  return Object.fromEntries(
    fields.map((field) => {
      const raw = row?.[field.name];
      if (field.kind === "checkbox") {
        return [field.name, Boolean(raw)];
      }
      if (field.kind === "multiselect") {
        return [field.name, Array.isArray(raw) ? raw.map((item) => String(item)) : []];
      }
      if (field.kind === "json") {
        return [field.name, raw ? JSON.stringify(raw, null, 2) : ""];
      }
      if (field.kind === "date" || field.kind === "datetime") {
        return [field.name, formatInputValue(field.kind, raw)];
      }
      return [field.name, raw === null || raw === undefined ? "" : String(raw)];
    }),
  );
}

function buildPayload(fields: CrudFieldConfig[], formState: FormState) {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = formState[field.name];
    if (field.kind === "checkbox") {
      payload[field.name] = Boolean(raw);
      continue;
    }
    if (field.kind === "multiselect") {
      payload[field.name] = Array.isArray(raw)
        ? raw.map((item) => (/^\d+$/.test(item) ? Number(item) : item))
        : [];
      continue;
    }
    if (field.kind === "json") {
      payload[field.name] = String(raw ?? "").trim() ? JSON.parse(String(raw)) : {};
      continue;
    }

    const text = String(raw ?? "").trim();
    if (!text) {
      if (field.allowBlank) {
        payload[field.name] = null;
      } else if (field.kind === "password") {
        continue;
      }
      continue;
    }

    if (field.kind === "number" || field.kind === "select") {
      payload[field.name] = /^\d+(\.\d+)?$/.test(text) ? Number(text) : text;
      continue;
    }

    payload[field.name] = text;
  }

  return payload;
}

function inputTypeFor(kind: CrudFieldConfig["kind"]) {
  switch (kind) {
    case "email":
      return "email";
    case "number":
      return "number";
    case "date":
      return "date";
    case "datetime":
      return "datetime-local";
    case "password":
      return "password";
    default:
      return "text";
  }
}

function formatInputValue(kind: CrudFieldConfig["kind"], value: FormStateValue | unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (kind === "date") {
    return text ? text.slice(0, 10) : "";
  }
  if (kind === "datetime") {
    const normalized = text.replace("Z", "");
    return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
  }
  return text;
}

function extractFieldErrors(details: unknown): FieldErrors {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(details as Record<string, unknown>).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String).join(" ") : String(value),
    ]),
  );
}
