import React, { useState } from "react";
import { createReportRequest } from "../../api";
import { toOptions } from "../../lib/format";
import { FormActions, FormPage, SelectOptions } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function ReportCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({client: "", site: "", report_type: "client_service", date_from: "", date_to: ""});
  return (
    <FormPage title="Create report request" eyebrow="Reports" onCancel={() => context.navigate("reports")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createReportRequest({
          client: form.client ? Number(form.client) : undefined,
          site: form.site ? Number(form.site) : undefined,
          report_type: form.report_type,
          date_from: form.date_from || undefined,
          date_to: form.date_to || undefined,
        }, context.token), "Report request created.", () => {
          setForm({client: "", site: "", report_type: "client_service", date_from: "", date_to: ""});
          context.navigate("reports");
        });
      }}>
        <label>Client<SelectOptions value={form.client} onChange={(value) => setForm({...form, client: value})} options={toOptions(context.setupData?.clients ?? [])} placeholder="All clients" /></label>
        <label>Site<SelectOptions value={form.site} onChange={(value) => setForm({...form, site: value})} options={toOptions(context.setupData?.sites ?? [])} placeholder="All sites" /></label>
        <label>
          Report type
          <select value={form.report_type} onChange={(event) => setForm({...form, report_type: event.target.value})}>
            <option value="client_service">Client Service</option>
            <option value="daily_attendance">Daily Attendance</option>
            <option value="patrol_completion">Patrol Completion</option>
            <option value="missed_checkpoint">Missed Checkpoint</option>
            <option value="incident">Incident</option>
            <option value="supervisor_inspection">Supervisor Inspection</option>
            <option value="site_performance">Site Performance</option>
          </select>
        </label>
        <label>Date from<input type="date" value={form.date_from} onChange={(event) => setForm({...form, date_from: event.target.value})} /></label>
        <label>Date to<input type="date" value={form.date_to} onChange={(event) => setForm({...form, date_to: event.target.value})} /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Create Report Request" />
      </form>
    } />
  );
}
