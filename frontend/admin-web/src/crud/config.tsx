import React from "react";
import { GenericRecord } from "../api";
import { formatDate, formatUnknown, humanize } from "../lib/format";
import { PageContext } from "../types/ui";

export type CrudOption = {
  label: string;
  value: string;
};

export type CrudFieldKind = "text" | "textarea" | "email" | "number" | "date" | "datetime" | "select" | "multiselect" | "checkbox" | "json" | "password";

export type CrudFieldConfig = {
  name: string;
  label: string;
  kind: CrudFieldKind;
  section?: string;
  description?: string;
  fullWidth?: boolean;
  required?: boolean;
  allowBlank?: boolean;
  rows?: number;
  options?: CrudOption[] | ((context: PageContext) => CrudOption[]);
};

export type CrudColumnConfig = {
  label: string;
  render: (row: GenericRecord, context: PageContext) => React.ReactNode;
};

export type CrudResourceConfig = {
  endpoint: string;
  eyebrow: string;
  title: string;
  helper: string;
  emptyMessage: string;
  createLabel: string;
  fields: CrudFieldConfig[];
  columns: CrudColumnConfig[];
  rowActions?: Array<{
    label: string;
    onClick: (row: GenericRecord, context: PageContext) => void | Promise<void>;
  }>;
};

const statusOptions = (values: string[]) => values.map((value) => ({value, label: humanize(value)}));

const mapOptions = (items: Array<{id: number; name?: string; code?: string; first_name?: string; last_name?: string}>) =>
  items.map((item) => ({
    value: String(item.id),
    label: item.name ?? item.code ?? [item.first_name, item.last_name].filter(Boolean).join(" ") ?? `Item ${item.id}`,
  }));

const clientOptions = (context: PageContext) => mapOptions(context.setupData?.clients ?? []);
const siteOptions = (context: PageContext) => mapOptions(context.setupData?.sites ?? []);
const guardOptions = (context: PageContext) => (context.setupData?.guards ?? []).map((item) => ({value: String(item.id), label: `${item.first_name} ${item.last_name}`}));
const routeOptions = (context: PageContext) => mapOptions(context.setupData?.routes ?? []);
const deviceOptions = (context: PageContext) => mapOptions(context.setupData?.devices ?? []);
const shiftOptions = (context: PageContext) => mapOptions(context.setupData?.shifts ?? []);
const checkpointOptions = (context: PageContext) => mapOptions(context.setupData?.checkpoints ?? []);
const assignmentOptions = (context: PageContext) =>
  ((context.supportData?.assignments ?? []) as Array<{id: number; guard?: number; shift?: number}>).map((item) => ({
    value: String(item.id),
    label: `Assignment ${item.id}${item.guard ? ` · ${relatedLabel(guardOptions(context), item.guard)}` : ""}${item.shift ? ` · ${relatedLabel(shiftOptions(context), item.shift)}` : ""}`,
  }));
const roleOptions = (context: PageContext) => mapOptions((context.supportData?.roles ?? []) as Array<{id: number; name?: string}>);
const userOptions = (context: PageContext) =>
  ((context.supportData?.users ?? []) as Array<{id: number; username?: string; first_name?: string; last_name?: string}>).map((item) => ({
    value: String(item.id),
    label: item.username ?? [item.first_name, item.last_name].filter(Boolean).join(" ") ?? `User ${item.id}`,
  }));
const branchOptions = (context: PageContext) => mapOptions((context.supportData?.branches ?? []) as Array<{id: number; name?: string}>);
const permissionOptions = (context: PageContext) =>
  ((context.supportData?.permissions ?? []) as Array<{id: number; code?: string; name?: string}>).map((item) => ({
    value: String(item.id),
    label: item.code ?? item.name ?? `Permission ${item.id}`,
  }));

const relatedLabel = (options: CrudOption[], value: unknown) => options.find((item) => String(item.value) === String(value))?.label ?? formatUnknown(value);

export const crudConfigs = {
  clients: {
    endpoint: "/clients/",
    eyebrow: "Clients",
    title: "Client register",
    helper: "Manage client organizations, contacts, and status.",
    emptyMessage: "No clients available.",
    createLabel: "New Client",
    fields: [
      {name: "name", label: "Name", kind: "text", required: true, section: "Account"},
      {name: "code", label: "Code", kind: "text", required: true, section: "Account"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["active", "inactive"]), section: "Account"},
      {name: "contact_name", label: "Contact name", kind: "text", section: "Primary Contact"},
      {name: "contact_email", label: "Contact email", kind: "email", section: "Primary Contact"},
      {name: "contact_phone", label: "Contact phone", kind: "text", section: "Primary Contact"},
      {name: "billing_address", label: "Billing address", kind: "textarea", rows: 3, section: "Primary Contact", fullWidth: true},
    ],
    columns: [
      {label: "Name", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Code", render: (row) => formatUnknown(row.code)},
      {label: "Primary contact", render: (row) => formatUnknown(row.contact_name)},
      {label: "Status", render: (row) => humanize(String(row.status ?? "active"))},
    ],
  },
  contracts: {
    endpoint: "/client-contracts/",
    eyebrow: "Clients",
    title: "Contract register",
    helper: "Track client contracts and agreement lifecycle.",
    emptyMessage: "No contract records are available.",
    createLabel: "New Contract",
    fields: [
      {name: "client", label: "Client", kind: "select", required: true, options: clientOptions, section: "Contract"},
      {name: "contract_number", label: "Contract number", kind: "text", required: true, section: "Contract"},
      {name: "title", label: "Title", kind: "text", required: true, section: "Contract", fullWidth: true},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["draft", "active", "expired", "terminated"]), section: "Contract"},
      {name: "starts_on", label: "Starts on", kind: "date", required: true, section: "Term"},
      {name: "ends_on", label: "Ends on", kind: "date", allowBlank: true, section: "Term"},
      {name: "billing_terms", label: "Billing terms", kind: "textarea", rows: 3, section: "Commercial Terms", fullWidth: true},
      {name: "service_level_agreement", label: "Service level agreement", kind: "textarea", rows: 3, section: "Commercial Terms", fullWidth: true},
    ],
    columns: [
      {label: "Contract", render: (row) => <strong>{String(row.contract_number ?? "-")}</strong>},
      {label: "Title", render: (row) => formatUnknown(row.title)},
      {label: "Client", render: (row, context) => relatedLabel(clientOptions(context), row.client)},
      {label: "Starts", render: (row) => formatUnknown(row.starts_on)},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  clientContacts: {
    endpoint: "/client-contacts/",
    eyebrow: "Clients",
    title: "Client contacts",
    helper: "Manage named contacts for each client account.",
    emptyMessage: "No client contacts available.",
    createLabel: "New Contact",
    fields: [
      {name: "client", label: "Client", kind: "select", required: true, options: clientOptions},
      {name: "name", label: "Name", kind: "text", required: true},
      {name: "title", label: "Title", kind: "text"},
      {name: "email", label: "Email", kind: "email"},
      {name: "phone", label: "Phone", kind: "text"},
      {name: "is_primary", label: "Primary", kind: "checkbox"},
      {name: "can_access_portal", label: "Portal access", kind: "checkbox"},
    ],
    columns: [
      {label: "Name", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Client", render: (row, context) => relatedLabel(clientOptions(context), row.client)},
      {label: "Title", render: (row) => formatUnknown(row.title)},
      {label: "Primary", render: (row) => formatUnknown(row.is_primary)},
    ],
  },
  sites: {
    endpoint: "/sites/",
    eyebrow: "Operations",
    title: "Site register",
    helper: "Maintain site operations details, staffing requirements, and contacts.",
    emptyMessage: "No sites available.",
    createLabel: "New Site",
    fields: [
      {name: "client", label: "Client", kind: "select", required: true, options: clientOptions, section: "Site Identity"},
      {name: "name", label: "Name", kind: "text", required: true, section: "Site Identity"},
      {name: "code", label: "Code", kind: "text", required: true, section: "Site Identity"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["active", "inactive"]), section: "Site Identity"},
      {name: "address", label: "Address", kind: "textarea", rows: 3, section: "Location", fullWidth: true},
      {name: "latitude", label: "Latitude", kind: "text", section: "Location"},
      {name: "longitude", label: "Longitude", kind: "text", section: "Location"},
      {name: "contact_name", label: "Contact name", kind: "text", section: "Operations"},
      {name: "contact_phone", label: "Contact phone", kind: "text", section: "Operations"},
      {name: "required_guards", label: "Required guards", kind: "number", section: "Operations"},
      {name: "shift_requirements", label: "Shift requirements", kind: "textarea", rows: 3, section: "Operations", fullWidth: true},
      {name: "patrol_requirements", label: "Patrol requirements", kind: "textarea", rows: 3, section: "Operations", fullWidth: true},
    ],
    columns: [
      {label: "Site", render: (row) => <><strong>{String(row.name ?? "-")}</strong><div className="table-subtle">{formatUnknown(row.code)}</div></>},
      {label: "Client", render: (row, context) => relatedLabel(clientOptions(context), row.client)},
      {label: "Required guards", render: (row) => formatUnknown(row.required_guards)},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  guards: {
    endpoint: "/guards/",
    eyebrow: "Operations",
    title: "Guard directory",
    helper: "Manage guard identity, status, and site assignment.",
    emptyMessage: "No guards available.",
    createLabel: "New Guard",
    fields: [
      {name: "user", label: "Linked user", kind: "select", allowBlank: true, options: userOptions, section: "Identity"},
      {name: "employee_number", label: "Employee number", kind: "text", required: true, section: "Identity"},
      {name: "card_number", label: "Card number", kind: "text", section: "Identity"},
      {name: "first_name", label: "First name", kind: "text", required: true, section: "Personal"},
      {name: "last_name", label: "Last name", kind: "text", required: true, section: "Personal"},
      {name: "phone", label: "Phone", kind: "text", section: "Personal"},
      {name: "email", label: "Email", kind: "email", section: "Personal"},
      {name: "national_id_number", label: "National ID", kind: "text", section: "Compliance"},
      {name: "license_number", label: "License number", kind: "text", section: "Compliance"},
      {name: "hired_on", label: "Hired on", kind: "date", allowBlank: true, section: "Compliance"},
      {name: "assigned_site", label: "Assigned site", kind: "select", allowBlank: true, options: siteOptions, section: "Deployment"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["available", "assigned", "on_duty", "off_duty", "on_leave", "active", "suspended", "terminated"]), section: "Deployment"},
    ],
    columns: [
      {label: "Guard", render: (row) => <strong>{String(row.first_name ?? "")} {String(row.last_name ?? "")}</strong>},
      {label: "Employee no.", render: (row) => formatUnknown(row.employee_number)},
      {label: "Assigned site", render: (row, context) => relatedLabel(siteOptions(context), row.assigned_site)},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  guardNextOfKin: {
    endpoint: "/guard-next-of-kin/",
    eyebrow: "Operations",
    title: "Guard next of kin",
    helper: "Maintain guard emergency and family contacts.",
    emptyMessage: "No next-of-kin records available.",
    createLabel: "New Next of Kin",
    fields: [
      {name: "guard", label: "Guard", kind: "select", required: true, options: guardOptions},
      {name: "name", label: "Name", kind: "text", required: true},
      {name: "relationship", label: "Relationship", kind: "text", required: true},
      {name: "phone", label: "Phone", kind: "text", required: true},
      {name: "address", label: "Address", kind: "textarea", rows: 3},
      {name: "is_primary", label: "Primary", kind: "checkbox"},
    ],
    columns: [
      {label: "Name", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Guard", render: (row, context) => relatedLabel(guardOptions(context), row.guard)},
      {label: "Relationship", render: (row) => formatUnknown(row.relationship)},
      {label: "Primary", render: (row) => formatUnknown(row.is_primary)},
    ],
  },
  guardDocuments: {
    endpoint: "/guard-documents/",
    eyebrow: "Operations",
    title: "Guard documents",
    helper: "Track guard licensing, ID, and document expiry.",
    emptyMessage: "No guard document records available.",
    createLabel: "New Document",
    fields: [
      {name: "guard", label: "Guard", kind: "select", required: true, options: guardOptions},
      {name: "document_type", label: "Document type", kind: "select", required: true, options: statusOptions(["national_id", "license", "certification", "training", "other"])},
      {name: "reference_number", label: "Reference number", kind: "text"},
      {name: "issued_on", label: "Issued on", kind: "date", allowBlank: true},
      {name: "expires_on", label: "Expires on", kind: "date", allowBlank: true},
      {name: "notes", label: "Notes", kind: "textarea", rows: 3},
    ],
    columns: [
      {label: "Guard", render: (row, context) => relatedLabel(guardOptions(context), row.guard)},
      {label: "Type", render: (row) => humanize(String(row.document_type ?? ""))},
      {label: "Reference", render: (row) => formatUnknown(row.reference_number)},
      {label: "Expires", render: (row) => formatUnknown(row.expires_on)},
    ],
  },
  guardTrainingRecords: {
    endpoint: "/guard-training-records/",
    eyebrow: "Operations",
    title: "Guard training records",
    helper: "Track guard training completion and provider details.",
    emptyMessage: "No guard training records available.",
    createLabel: "New Training Record",
    fields: [
      {name: "guard", label: "Guard", kind: "select", required: true, options: guardOptions},
      {name: "title", label: "Title", kind: "text", required: true},
      {name: "provider", label: "Provider", kind: "text"},
      {name: "completed_on", label: "Completed on", kind: "date", allowBlank: true},
      {name: "expires_on", label: "Expires on", kind: "date", allowBlank: true},
      {name: "notes", label: "Notes", kind: "textarea", rows: 3},
    ],
    columns: [
      {label: "Title", render: (row) => <strong>{String(row.title ?? "-")}</strong>},
      {label: "Guard", render: (row, context) => relatedLabel(guardOptions(context), row.guard)},
      {label: "Provider", render: (row) => formatUnknown(row.provider)},
      {label: "Expires", render: (row) => formatUnknown(row.expires_on)},
    ],
  },
  uniformIssues: {
    endpoint: "/uniform-issues/",
    eyebrow: "Operations",
    title: "Uniform issues",
    helper: "Track issued items and return dates.",
    emptyMessage: "No uniform issue records available.",
    createLabel: "New Uniform Issue",
    fields: [
      {name: "guard", label: "Guard", kind: "select", required: true, options: guardOptions},
      {name: "item", label: "Item", kind: "text", required: true},
      {name: "quantity", label: "Quantity", kind: "number", required: true},
      {name: "issued_on", label: "Issued on", kind: "date", required: true},
      {name: "returned_on", label: "Returned on", kind: "date", allowBlank: true},
      {name: "notes", label: "Notes", kind: "textarea", rows: 3},
    ],
    columns: [
      {label: "Item", render: (row) => <strong>{String(row.item ?? "-")}</strong>},
      {label: "Guard", render: (row, context) => relatedLabel(guardOptions(context), row.guard)},
      {label: "Quantity", render: (row) => formatUnknown(row.quantity)},
      {label: "Issued", render: (row) => formatUnknown(row.issued_on)},
    ],
  },
  disciplinaryRecords: {
    endpoint: "/disciplinary-records/",
    eyebrow: "Operations",
    title: "Disciplinary records",
    helper: "Track disciplinary actions and severity.",
    emptyMessage: "No disciplinary records available.",
    createLabel: "New Record",
    fields: [
      {name: "guard", label: "Guard", kind: "select", required: true, options: guardOptions},
      {name: "title", label: "Title", kind: "text", required: true},
      {name: "description", label: "Description", kind: "textarea", required: true, rows: 4},
      {name: "action_taken", label: "Action taken", kind: "textarea", rows: 3},
      {name: "severity", label: "Severity", kind: "select", required: true, options: statusOptions(["low", "medium", "high"])},
      {name: "occurred_on", label: "Occurred on", kind: "date", required: true},
    ],
    columns: [
      {label: "Title", render: (row) => <strong>{String(row.title ?? "-")}</strong>},
      {label: "Guard", render: (row, context) => relatedLabel(guardOptions(context), row.guard)},
      {label: "Severity", render: (row) => humanize(String(row.severity ?? ""))},
      {label: "Occurred", render: (row) => formatUnknown(row.occurred_on)},
    ],
  },
  shifts: {
    endpoint: "/shifts/",
    eyebrow: "Operations",
    title: "Shift schedule",
    helper: "Plan shift coverage windows and lifecycle.",
    emptyMessage: "No shifts available.",
    createLabel: "New Shift",
    fields: [
      {name: "site", label: "Site", kind: "select", required: true, options: siteOptions, section: "Schedule"},
      {name: "name", label: "Name", kind: "text", required: true, section: "Schedule"},
      {name: "starts_at", label: "Starts at", kind: "datetime", required: true, section: "Timing"},
      {name: "ends_at", label: "Ends at", kind: "datetime", required: true, section: "Timing"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["planned", "active", "completed", "cancelled"]), section: "Timing"},
    ],
    columns: [
      {label: "Shift", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Starts", render: (row) => row.starts_at ? formatDate(String(row.starts_at)) : "-"},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  assignments: {
    endpoint: "/assignments/",
    eyebrow: "Operations",
    title: "Assignment register",
    helper: "Assign guards to shifts with optional device and patrol route links.",
    emptyMessage: "No assignments available.",
    createLabel: "New Assignment",
    fields: [
      {name: "guard", label: "Guard", kind: "select", required: true, options: guardOptions, section: "Assignment"},
      {name: "shift", label: "Shift", kind: "select", required: true, options: shiftOptions, section: "Assignment"},
      {name: "supervisor", label: "Supervisor", kind: "select", allowBlank: true, options: userOptions, section: "Assignment"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["assigned", "confirmed", "completed", "missed"]), section: "Assignment"},
      {name: "patrol_route", label: "Patrol route", kind: "select", allowBlank: true, options: routeOptions, section: "Patrol Setup"},
      {name: "patrol_device", label: "Patrol device", kind: "select", allowBlank: true, options: deviceOptions, section: "Patrol Setup"},
      {name: "deployment_confirmed_at", label: "Deployment confirmed", kind: "datetime", allowBlank: true, section: "Patrol Setup"},
      {name: "notes", label: "Notes", kind: "textarea", rows: 3, section: "Notes", fullWidth: true},
    ],
    columns: [
      {label: "Guard", render: (row, context) => relatedLabel(guardOptions(context), row.guard)},
      {label: "Shift", render: (row, context) => relatedLabel(shiftOptions(context), row.shift)},
      {label: "Route", render: (row, context) => relatedLabel(routeOptions(context), row.patrol_route)},
      {label: "Device", render: (row, context) => relatedLabel(deviceOptions(context), row.patrol_device)},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  attendance: {
    endpoint: "/attendance/",
    eyebrow: "Operations",
    title: "Attendance records",
    helper: "Maintain attendance check-in and check-out events per assignment.",
    emptyMessage: "No attendance records available.",
    createLabel: "New Attendance",
    fields: [
      {name: "assignment", label: "Assignment", kind: "select", required: true, options: assignmentOptions},
      {name: "checked_in_at", label: "Checked in at", kind: "datetime", allowBlank: true},
      {name: "checked_out_at", label: "Checked out at", kind: "datetime", allowBlank: true},
      {name: "source", label: "Source", kind: "select", required: true, options: statusOptions(["manual", "device"])},
      {name: "notes", label: "Notes", kind: "textarea", rows: 3},
    ],
    columns: [
      {label: "Assignment", render: (row, context) => relatedLabel(assignmentOptions(context), row.assignment)},
      {label: "Checked in", render: (row) => row.checked_in_at ? formatDate(String(row.checked_in_at)) : "-"},
      {label: "Checked out", render: (row) => row.checked_out_at ? formatDate(String(row.checked_out_at)) : "-"},
      {label: "Source", render: (row) => humanize(String(row.source ?? ""))},
    ],
  },
  devices: {
    endpoint: "/devices/",
    eyebrow: "Patrol",
    title: "Device inventory",
    helper: "Manage patrol hardware registration, status, and syncing attributes.",
    emptyMessage: "No devices available.",
    createLabel: "New Device",
    fields: [
      {name: "site", label: "Site", kind: "select", allowBlank: true, options: siteOptions, section: "Registration"},
      {name: "name", label: "Name", kind: "text", required: true, section: "Registration"},
      {name: "device_number", label: "Device number", kind: "text", required: true, section: "Registration"},
      {name: "imei", label: "IMEI", kind: "text", section: "Identity"},
      {name: "serial_number", label: "Serial number", kind: "text", section: "Identity"},
      {name: "connection_mode", label: "Connection mode", kind: "select", required: true, options: statusOptions(["usb", "tcp"]), section: "Connectivity"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["registered", "active", "inactive", "maintenance"]), section: "Connectivity"},
      {name: "last_synced_at", label: "Last synced", kind: "datetime", allowBlank: true, section: "Connectivity"},
      {name: "sdk_metadata", label: "SDK metadata", kind: "json", section: "Advanced", fullWidth: true},
    ],
    columns: [
      {label: "Device", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Device no.", render: (row) => formatUnknown(row.device_number)},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  checkpoints: {
    endpoint: "/checkpoints/",
    eyebrow: "Patrol",
    title: "Checkpoint register",
    helper: "Maintain checkpoint identity, verification kind, and geo settings.",
    emptyMessage: "No checkpoints available.",
    createLabel: "New Checkpoint",
    fields: [
      {name: "site", label: "Site", kind: "select", required: true, options: siteOptions, section: "Checkpoint"},
      {name: "name", label: "Name", kind: "text", required: true, section: "Checkpoint"},
      {name: "code", label: "Code", kind: "text", required: true, section: "Checkpoint"},
      {name: "kind", label: "Kind", kind: "select", required: true, options: statusOptions(["rfid", "gps"]), section: "Checkpoint"},
      {name: "latitude", label: "Latitude", kind: "text", section: "Location"},
      {name: "longitude", label: "Longitude", kind: "text", section: "Location"},
      {name: "radius_meters", label: "Radius meters", kind: "number", section: "Location"},
      {name: "event_codes", label: "Event codes", kind: "text", section: "Control"},
      {name: "is_active", label: "Active", kind: "checkbox", section: "Control"},
    ],
    columns: [
      {label: "Checkpoint", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Code", render: (row) => formatUnknown(row.code)},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Kind", render: (row) => humanize(String(row.kind ?? ""))},
    ],
  },
  routes: {
    endpoint: "/patrol-routes/",
    eyebrow: "Patrol",
    title: "Route register",
    helper: "Manage patrol routes and their activation state.",
    emptyMessage: "No patrol routes available.",
    createLabel: "New Route",
    fields: [
      {name: "site", label: "Site", kind: "select", required: true, options: siteOptions, section: "Route"},
      {name: "name", label: "Name", kind: "text", required: true, section: "Route"},
      {name: "code", label: "Code", kind: "text", required: true, section: "Route"},
      {name: "is_active", label: "Active", kind: "checkbox", section: "Route"},
      {name: "description", label: "Description", kind: "textarea", rows: 3, section: "Notes", fullWidth: true},
    ],
    columns: [
      {label: "Route", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Code", render: (row) => formatUnknown(row.code)},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Active", render: (row) => formatUnknown(row.is_active)},
    ],
  },
  routeSteps: {
    endpoint: "/patrol-route-checkpoints/",
    eyebrow: "Patrol",
    title: "Route steps",
    helper: "Sequence checkpoints inside patrol routes.",
    emptyMessage: "No route steps available.",
    createLabel: "New Step",
    fields: [
      {name: "route", label: "Route", kind: "select", required: true, options: routeOptions},
      {name: "checkpoint", label: "Checkpoint", kind: "select", required: true, options: checkpointOptions},
      {name: "sequence", label: "Sequence", kind: "number", required: true},
      {name: "expected_offset_minutes", label: "Offset minutes", kind: "number", required: true},
    ],
    columns: [
      {label: "Route", render: (row, context) => relatedLabel(routeOptions(context), row.route)},
      {label: "Checkpoint", render: (row, context) => relatedLabel(checkpointOptions(context), row.checkpoint)},
      {label: "Sequence", render: (row) => formatUnknown(row.sequence)},
      {label: "Offset", render: (row) => formatUnknown(row.expected_offset_minutes)},
    ],
  },
  patrolRecords: {
    endpoint: "/patrol-records/",
    eyebrow: "Patrol",
    title: "Patrol records",
    helper: "Manage synced or imported patrol events.",
    emptyMessage: "No patrol records available.",
    createLabel: "New Record",
    fields: [
      {name: "device", label: "Device", kind: "select", allowBlank: true, options: deviceOptions},
      {name: "guard", label: "Guard", kind: "select", allowBlank: true, options: guardOptions},
      {name: "checkpoint", label: "Checkpoint", kind: "select", allowBlank: true, options: checkpointOptions},
      {name: "route", label: "Route", kind: "select", allowBlank: true, options: routeOptions},
      {name: "source", label: "Source", kind: "select", required: true, options: statusOptions(["usb", "tcp", "manual_import"])},
      {name: "source_record_id", label: "Source record ID", kind: "text"},
      {name: "device_number", label: "Device number", kind: "text"},
      {name: "imei", label: "IMEI", kind: "text"},
      {name: "guard_identifier", label: "Guard identifier", kind: "text"},
      {name: "checkpoint_identifier", label: "Checkpoint identifier", kind: "text"},
      {name: "record_type", label: "Record type", kind: "text"},
      {name: "occurred_at", label: "Occurred at", kind: "datetime", required: true},
      {name: "information", label: "Information", kind: "textarea", rows: 3},
      {name: "latitude", label: "Latitude", kind: "text"},
      {name: "longitude", label: "Longitude", kind: "text"},
      {name: "speed", label: "Speed", kind: "text"},
      {name: "satellites", label: "Satellites", kind: "number"},
      {name: "raw_payload", label: "Raw payload", kind: "json"},
    ],
    columns: [
      {label: "Occurred", render: (row) => row.occurred_at ? formatDate(String(row.occurred_at)) : "-"},
      {label: "Guard", render: (row, context) => relatedLabel(guardOptions(context), row.guard)},
      {label: "Checkpoint", render: (row, context) => relatedLabel(checkpointOptions(context), row.checkpoint)},
      {label: "Source", render: (row) => humanize(String(row.source ?? ""))},
    ],
  },
  patrolExceptions: {
    endpoint: "/patrol-exceptions/",
    eyebrow: "Patrol",
    title: "Patrol exceptions",
    helper: "Track missed, late, and invalid patrol events.",
    emptyMessage: "No patrol exceptions available.",
    createLabel: "New Exception",
    fields: [
      {name: "assignment", label: "Assignment", kind: "select", required: true, options: assignmentOptions},
      {name: "route", label: "Route", kind: "select", allowBlank: true, options: routeOptions},
      {name: "checkpoint", label: "Checkpoint", kind: "select", allowBlank: true, options: checkpointOptions},
      {name: "exception_type", label: "Exception type", kind: "select", required: true, options: statusOptions(["missed_checkpoint", "late_checkpoint", "wrong_sequence", "device_not_synced"])},
      {name: "expected_at", label: "Expected at", kind: "datetime", allowBlank: true},
      {name: "actual_at", label: "Actual at", kind: "datetime", allowBlank: true},
      {name: "details", label: "Details", kind: "textarea", rows: 3},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["open", "reviewed", "resolved"])},
    ],
    columns: [
      {label: "Assignment", render: (row, context) => relatedLabel(assignmentOptions(context), row.assignment)},
      {label: "Checkpoint", render: (row, context) => relatedLabel(checkpointOptions(context), row.checkpoint)},
      {label: "Type", render: (row) => humanize(String(row.exception_type ?? ""))},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  incidents: {
    endpoint: "/incidents/",
    eyebrow: "Incidents",
    title: "Incident center",
    helper: "Track incident reporting, severity, and resolution state.",
    emptyMessage: "No incident records are available.",
    createLabel: "New Incident",
    fields: [
      {name: "site", label: "Site", kind: "select", required: true, options: siteOptions, section: "Incident"},
      {name: "guard", label: "Guard", kind: "select", allowBlank: true, options: guardOptions, section: "Incident"},
      {name: "reported_by", label: "Reported by", kind: "select", allowBlank: true, options: userOptions, section: "Incident"},
      {name: "title", label: "Title", kind: "text", required: true, section: "Details", fullWidth: true},
      {name: "description", label: "Description", kind: "textarea", required: true, rows: 4, section: "Details", fullWidth: true},
      {name: "severity", label: "Severity", kind: "select", required: true, options: statusOptions(["low", "medium", "high", "critical"]), section: "Resolution"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["open", "investigating", "resolved", "closed"]), section: "Resolution"},
      {name: "occurred_at", label: "Occurred at", kind: "datetime", required: true, section: "Resolution"},
      {name: "resolved_at", label: "Resolved at", kind: "datetime", allowBlank: true, section: "Resolution"},
    ],
    columns: [
      {label: "Title", render: (row) => <strong>{String(row.title ?? "-")}</strong>},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Severity", render: (row) => humanize(String(row.severity ?? ""))},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  inspections: {
    endpoint: "/supervisor-inspections/",
    eyebrow: "Incidents",
    title: "Supervisor inspections",
    helper: "Record inspection outcomes, feedback, and operational follow-up.",
    emptyMessage: "No inspection records are available.",
    createLabel: "New Inspection",
    fields: [
      {name: "site", label: "Site", kind: "select", required: true, options: siteOptions},
      {name: "supervisor", label: "Supervisor", kind: "select", allowBlank: true, options: userOptions},
      {name: "inspected_at", label: "Inspected at", kind: "datetime", required: true},
      {name: "guard_appearance_ok", label: "Guard appearance OK", kind: "checkbox"},
      {name: "post_order_compliance_ok", label: "Post order compliance OK", kind: "checkbox"},
      {name: "patrol_device_ok", label: "Patrol device OK", kind: "checkbox"},
      {name: "attendance_confirmed", label: "Attendance confirmed", kind: "checkbox"},
      {name: "client_feedback", label: "Client feedback", kind: "textarea", rows: 3},
      {name: "remarks", label: "Remarks", kind: "textarea", rows: 3},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["draft", "submitted", "reviewed"])},
    ],
    columns: [
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Supervisor", render: (row, context) => relatedLabel(userOptions(context), row.supervisor)},
      {label: "Inspected", render: (row) => row.inspected_at ? formatDate(String(row.inspected_at)) : "-"},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  complaints: {
    endpoint: "/client-complaints/",
    eyebrow: "Incidents",
    title: "Client complaints",
    helper: "Track client-submitted complaints and resolution progress.",
    emptyMessage: "No client complaints are available.",
    createLabel: "New Complaint",
    fields: [
      {name: "client", label: "Client", kind: "select", required: true, options: clientOptions},
      {name: "site", label: "Site", kind: "select", allowBlank: true, options: siteOptions},
      {name: "submitted_by", label: "Submitted by", kind: "select", allowBlank: true, options: userOptions},
      {name: "title", label: "Title", kind: "text", required: true},
      {name: "description", label: "Description", kind: "textarea", required: true, rows: 4},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["open", "investigating", "resolved", "closed"])},
      {name: "resolved_at", label: "Resolved at", kind: "datetime", allowBlank: true},
    ],
    columns: [
      {label: "Title", render: (row) => <strong>{String(row.title ?? "-")}</strong>},
      {label: "Client", render: (row, context) => relatedLabel(clientOptions(context), row.client)},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
  },
  reports: {
    endpoint: "/report-requests/",
    eyebrow: "Reports",
    title: "Report queue",
    helper: "Create, review, and manage report requests.",
    emptyMessage: "No report requests are available.",
    createLabel: "New Report",
    fields: [
      {name: "requested_by", label: "Requested by", kind: "select", allowBlank: true, options: userOptions, section: "Request"},
      {name: "client", label: "Client", kind: "select", allowBlank: true, options: clientOptions, section: "Request"},
      {name: "site", label: "Site", kind: "select", allowBlank: true, options: siteOptions, section: "Request"},
      {name: "report_type", label: "Report type", kind: "select", required: true, options: statusOptions(["daily_attendance", "duty_roster", "patrol_completion", "missed_checkpoint", "incident", "supervisor_inspection", "client_service", "device_usage", "guard_performance", "site_performance"]), section: "Request"},
      {name: "date_from", label: "Date from", kind: "date", allowBlank: true, section: "Period"},
      {name: "date_to", label: "Date to", kind: "date", allowBlank: true, section: "Period"},
      {name: "status", label: "Status", kind: "select", required: true, options: statusOptions(["pending", "running", "completed", "failed"]), section: "Output"},
      {name: "file_url", label: "File URL", kind: "text", section: "Output"},
      {name: "parameters", label: "Parameters", kind: "json", section: "Output", fullWidth: true},
    ],
    columns: [
      {label: "Type", render: (row) => <strong>{humanize(String(row.report_type ?? ""))}</strong>},
      {label: "Client", render: (row, context) => relatedLabel(clientOptions(context), row.client)},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Status", render: (row) => humanize(String(row.status ?? ""))},
    ],
    rowActions: [
      {label: "CSV", onClick: (row, context) => context.onReportDownload(Number(row.id), "csv")},
      {label: "JSON", onClick: (row, context) => context.onReportDownload(Number(row.id), "json")},
    ],
  },
  users: {
    endpoint: "/users/",
    eyebrow: "Administration",
    title: "User accounts",
    helper: "Manage internal accounts, role assignment, and activation state.",
    emptyMessage: "No user records are available.",
    createLabel: "New User",
    fields: [
      {name: "username", label: "Username", kind: "text", required: true, section: "Account"},
      {name: "password", label: "Password", kind: "password", section: "Account", description: "Leave blank when editing to keep the current password."},
      {name: "email", label: "Email", kind: "email", section: "Identity"},
      {name: "first_name", label: "First name", kind: "text", section: "Identity"},
      {name: "last_name", label: "Last name", kind: "text", section: "Identity"},
      {name: "phone", label: "Phone", kind: "text", section: "Identity"},
      {name: "role", label: "Role", kind: "select", allowBlank: true, options: roleOptions, section: "Access"},
      {name: "client", label: "Client", kind: "select", allowBlank: true, options: clientOptions, section: "Access"},
      {name: "is_active", label: "Active", kind: "checkbox", section: "Access"},
      {name: "is_staff", label: "Staff", kind: "checkbox", section: "Access"},
    ],
    columns: [
      {label: "Username", render: (row) => <strong>{String(row.username ?? "-")}</strong>},
      {label: "Email", render: (row) => formatUnknown(row.email)},
      {label: "Role", render: (row, context) => relatedLabel(roleOptions(context), row.role)},
      {label: "Active", render: (row) => formatUnknown(row.is_active)},
    ],
  },
  roles: {
    endpoint: "/roles/",
    eyebrow: "Administration",
    title: "Role directory",
    helper: "Manage role codes, names, and linked permissions.",
    emptyMessage: "No roles are available.",
    createLabel: "New Role",
    fields: [
      {name: "code", label: "Code", kind: "text", required: true, section: "Role"},
      {name: "name", label: "Name", kind: "text", required: true, section: "Role"},
      {name: "permissions", label: "Permissions", kind: "multiselect", options: permissionOptions, section: "Permissions", fullWidth: true, description: "Select one or more permission codes for this role."},
    ],
    columns: [
      {label: "Code", render: (row) => <strong>{String(row.code ?? "-")}</strong>},
      {label: "Name", render: (row) => formatUnknown(row.name)},
      {label: "Permissions", render: (row, context) => Array.isArray(row.permissions) ? row.permissions.map((value) => relatedLabel(permissionOptions(context), value)).join(", ") : "-"},
    ],
  },
  permissions: {
    endpoint: "/permissions/",
    eyebrow: "Administration",
    title: "Permissions",
    helper: "Maintain permission codes and descriptions.",
    emptyMessage: "No permissions are available.",
    createLabel: "New Permission",
    fields: [
      {name: "code", label: "Code", kind: "text", required: true},
      {name: "name", label: "Name", kind: "text", required: true},
      {name: "description", label: "Description", kind: "textarea", rows: 3},
    ],
    columns: [
      {label: "Code", render: (row) => <strong>{String(row.code ?? "-")}</strong>},
      {label: "Name", render: (row) => formatUnknown(row.name)},
      {label: "Description", render: (row) => formatUnknown(row.description)},
    ],
  },
  siteInstructions: {
    endpoint: "/site-instructions/",
    eyebrow: "Clients",
    title: "Site instructions",
    helper: "Maintain site post orders and operating instructions.",
    emptyMessage: "No site instructions are available.",
    createLabel: "New Instruction",
    fields: [
      {name: "site", label: "Site", kind: "select", required: true, options: siteOptions},
      {name: "title", label: "Title", kind: "text", required: true},
      {name: "category", label: "Category", kind: "select", required: true, options: statusOptions(["post_order", "emergency", "patrol", "access_control", "other"])},
      {name: "body", label: "Body", kind: "textarea", required: true, rows: 4},
      {name: "is_active", label: "Active", kind: "checkbox"},
    ],
    columns: [
      {label: "Title", render: (row) => <strong>{String(row.title ?? "-")}</strong>},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Category", render: (row) => humanize(String(row.category ?? ""))},
      {label: "Active", render: (row) => formatUnknown(row.is_active)},
    ],
  },
  siteEmergencyContacts: {
    endpoint: "/site-emergency-contacts/",
    eyebrow: "Clients",
    title: "Emergency contacts",
    helper: "Maintain site emergency contact rosters.",
    emptyMessage: "No site emergency contacts are available.",
    createLabel: "New Contact",
    fields: [
      {name: "site", label: "Site", kind: "select", required: true, options: siteOptions},
      {name: "name", label: "Name", kind: "text", required: true},
      {name: "role", label: "Role", kind: "text"},
      {name: "phone", label: "Phone", kind: "text", required: true},
      {name: "email", label: "Email", kind: "email"},
      {name: "priority", label: "Priority", kind: "number"},
    ],
    columns: [
      {label: "Name", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Site", render: (row, context) => relatedLabel(siteOptions(context), row.site)},
      {label: "Role", render: (row) => formatUnknown(row.role)},
      {label: "Priority", render: (row) => formatUnknown(row.priority)},
    ],
  },
  companySettings: {
    endpoint: "/company-settings/",
    eyebrow: "Administration",
    title: "Company settings",
    helper: "Maintain company profile and timezone defaults.",
    emptyMessage: "No company settings are available.",
    createLabel: "New Company Profile",
    fields: [
      {name: "name", label: "Name", kind: "text", required: true, section: "Profile"},
      {name: "legal_name", label: "Legal name", kind: "text", section: "Profile"},
      {name: "timezone", label: "Timezone", kind: "text", section: "Profile"},
      {name: "email", label: "Email", kind: "email", section: "Contact"},
      {name: "phone", label: "Phone", kind: "text", section: "Contact"},
      {name: "address", label: "Address", kind: "textarea", rows: 3, section: "Contact", fullWidth: true},
    ],
    columns: [
      {label: "Name", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Email", render: (row) => formatUnknown(row.email)},
      {label: "Timezone", render: (row) => formatUnknown(row.timezone)},
    ],
  },
  branches: {
    endpoint: "/branches/",
    eyebrow: "Administration",
    title: "Branches",
    helper: "Manage branch codes, region, and office contact details.",
    emptyMessage: "No branches are available.",
    createLabel: "New Branch",
    fields: [
      {name: "name", label: "Name", kind: "text", required: true},
      {name: "code", label: "Code", kind: "text", required: true},
      {name: "region", label: "Region", kind: "text"},
      {name: "address", label: "Address", kind: "textarea", rows: 3},
      {name: "phone", label: "Phone", kind: "text"},
      {name: "email", label: "Email", kind: "email"},
      {name: "is_active", label: "Active", kind: "checkbox"},
    ],
    columns: [
      {label: "Branch", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Code", render: (row) => formatUnknown(row.code)},
      {label: "Region", render: (row) => formatUnknown(row.region)},
      {label: "Active", render: (row) => formatUnknown(row.is_active)},
    ],
  },
  departments: {
    endpoint: "/departments/",
    eyebrow: "Administration",
    title: "Departments",
    helper: "Manage departments and their branch linkage.",
    emptyMessage: "No departments are available.",
    createLabel: "New Department",
    fields: [
      {name: "branch", label: "Branch", kind: "select", allowBlank: true, options: branchOptions},
      {name: "name", label: "Name", kind: "text", required: true},
      {name: "code", label: "Code", kind: "text", required: true},
      {name: "description", label: "Description", kind: "textarea", rows: 3},
      {name: "is_active", label: "Active", kind: "checkbox"},
    ],
    columns: [
      {label: "Department", render: (row) => <strong>{String(row.name ?? "-")}</strong>},
      {label: "Branch", render: (row, context) => relatedLabel(branchOptions(context), row.branch)},
      {label: "Code", render: (row) => formatUnknown(row.code)},
      {label: "Active", render: (row) => formatUnknown(row.is_active)},
    ],
  },
} satisfies Record<string, CrudResourceConfig>;

export type CrudConfigKey = keyof typeof crudConfigs;
