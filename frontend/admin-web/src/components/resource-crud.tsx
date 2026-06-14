import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  APIError,
  createResource,
  deleteResource,
  fetchResourcePage,
  GenericRecord,
  updateResource,
} from "../api";
import { recordFocusMatchesConfig } from "../lib/record-focus";
import { CrudConfigKey, CrudFieldConfig, CrudResourceConfig, crudConfigs } from "../crud/config";
import { buildPaginationSummary, extractFieldErrors } from "../lib/format";
import { PageContext } from "../types/ui";
import { DataTable, FilterBar, PaginationBar, Panel } from "./ui";

const PAGE_SIZE = 25;

type FormStateValue = string | boolean | string[];
type FormState = Record<string, FormStateValue>;
type FieldErrors = Record<string, string>;

export function ResourceCrudPage({
  context,
  configKey,
  nested,
  additionalRowActions,
  panelIntro,
  reloadToken,
}: {
  context: PageContext;
  configKey: CrudConfigKey;
  nested?: boolean;
  additionalRowActions?: CrudResourceConfig["rowActions"];
  panelIntro?: React.ReactNode;
  reloadToken?: number;
}) {
  const config: CrudResourceConfig = crudConfigs[configKey];
  const [rows, setRows] = useState<GenericRecord[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [currentRow, setCurrentRow] = useState<GenericRecord | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [localNotice, setLocalNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [highlightRowId, setHighlightRowId] = useState<number | null>(null);

  useEffect(() => {
    const focus = context.recordFocus;
    if (!focus || !recordFocusMatchesConfig(focus, configKey)) {
      return;
    }
    setQuery(focus.label);
    setPage(1);
    setHighlightRowId(focus.id);
    context.clearRecordFocus();
  }, [context.recordFocus, configKey, context.clearRecordFocus]);

  useEffect(() => {
    void load(page);
  }, [context.token, config.endpoint, page, reloadToken]);

  useEffect(() => {
    if (!mode) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeForm();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  async function load(nextPage = page) {
    const response = await fetchResourcePage<GenericRecord>(config.endpoint, context.token, nextPage, PAGE_SIZE);
    setRows(response.results);
    setTotalCount(response.count);
  }

  const filteredRows = useMemo(
    () => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  );
  const formSections = useMemo(() => buildFormSections(config.fields), [config.fields]);

  function closeForm() {
    setMode(null);
    setCurrentRow(null);
    setLocalError("");
    setFieldErrors({});
    setLocalNotice("");
  }

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
      setIsSaving(true);
      setLocalError("");
      setFieldErrors({});
      setLocalNotice("");
      const payload = buildPayload(config.fields, formState);
      if (mode === "create") {
        await createResource(config.endpoint, payload, context.token);
        setLocalNotice(`${config.title} created.`);
      } else if (mode === "edit" && currentRow?.id) {
        await updateResource(config.endpoint, Number(currentRow.id), payload, context.token);
        setLocalNotice(`${config.title} updated.`);
      }
      await load(page);
      await context.refreshAll();
      closeForm();
    } catch (error) {
      if (error instanceof APIError) {
        setLocalError(error.message);
        setFieldErrors(extractFieldErrors(error.details));
      } else {
        setLocalError(error instanceof Error ? error.message : "Save failed");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function removeRow(row: GenericRecord) {
    if (!window.confirm(`Delete this ${config.title.toLowerCase()} record?`)) {
      return;
    }
    try {
      setLocalError("");
      await deleteResource(config.endpoint, Number(row.id), context.token);
      await load(page);
      await context.refreshAll();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Delete failed");
    }
  }

  const rowActions = [...(additionalRowActions ?? []), ...(config.rowActions ?? [])];

  const table = (
    <>
      {panelIntro}
      <div className="resource-toolbar">
        <FilterBar query={query} setQuery={setQuery} placeholder={`Filter ${config.title.toLowerCase()}…`} />
        <span className="resource-toolbar-meta">{filteredRows.length} shown · {totalCount} total</span>
      </div>
      <DataTable
        columns={[
          ...config.columns.map((column) => ({
            label: column.label,
            render: (row: GenericRecord) => column.render(row, context),
          })),
          {
            label: "",
            className: "col-actions",
            render: (row: GenericRecord) => (
              <div className="inline-actions table-actions">
                {rowActions.map((action) => (
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
        highlightRowId={highlightRowId}
      />
      <PaginationBar page={page} pageSize={PAGE_SIZE} total={totalCount} onPageChange={setPage} />
    </>
  );

  const drawer = mode ? (
    <div className="crud-drawer-backdrop" onClick={closeForm}>
      <aside className="crud-drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="crud-drawer-header">
          <div>
            <p className="eyebrow">{mode === "create" ? "New record" : `Edit #${currentRow?.id ?? ""}`}</p>
            <h2>{mode === "create" ? config.createLabel : config.title}</h2>
          </div>
          <button type="button" className="ghost-button icon-button" onClick={closeForm} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {localNotice ? <div className="success-banner drawer-banner">{localNotice}</div> : null}
        {localError ? <div className="error-banner drawer-banner">{localError}</div> : null}
        <div className="crud-drawer-body">
          {formSections.map((section) => (
            <section key={section.title} className="form-section">
              <div className="form-section-header">
                <h3>{section.title}</h3>
              </div>
              <div className="form-grid form-grid-two-column">
                {section.fields.map((field) => renderField(field, formState, setFormState, context, fieldErrors[field.name]))}
              </div>
            </section>
          ))}
        </div>
        <div className="crud-drawer-footer">
          <button type="button" className="ghost-button" onClick={closeForm}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={() => void save()} disabled={isSaving || context.isSubmitting}>
            {isSaving ? "Saving…" : mode === "create" ? config.createLabel : "Save changes"}
          </button>
        </div>
      </aside>
    </div>
  ) : null;

  if (nested) {
    return (
      <>
        <Panel
          title={config.title}
          compact
          action={
            <button type="button" className="primary-button small-button" onClick={openCreate}>
              {config.createLabel}
            </button>
          }
        >
          {table}
        </Panel>
        {drawer}
      </>
    );
  }

  return (
    <div className="page-stack">
      <Panel
        title={config.title}
        action={
          <div className="resource-panel-actions">
            <span className="resource-toolbar-meta">{buildPaginationSummary(page, PAGE_SIZE, totalCount)}</span>
            <button type="button" className="primary-button" onClick={openCreate}>
              {config.createLabel}
            </button>
          </div>
        }
      >
        {table}
      </Panel>
      {drawer}
    </div>
  );
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
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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
          placeholder="{}"
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
    const title = field.section ?? "Details";
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
      payload[field.name] = Array.isArray(raw) ? raw.map((item) => (/^\d+$/.test(item) ? Number(item) : item)) : [];
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
