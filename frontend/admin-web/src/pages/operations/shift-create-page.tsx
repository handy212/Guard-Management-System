import React, { useState } from "react";
import { createShift } from "../../api";
import { toOptions } from "../../lib/format";
import { FormActions, FormPage, SelectOptions } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function ShiftCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({site: "", name: "", starts_at: "", ends_at: ""});
  return (
    <FormPage title="Create shift" eyebrow="Operations" onCancel={() => context.navigate("operations/shifts")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createShift({...form, site: Number(form.site)}, context.token), "Shift created.", () => {
          setForm({site: "", name: "", starts_at: "", ends_at: ""});
          context.navigate("operations/shifts");
        });
      }}>
        <label>Site<SelectOptions value={form.site} onChange={(value) => setForm({...form, site: value})} options={toOptions(context.setupData?.sites ?? [])} required placeholder="Select site" /></label>
        <label>Name<input value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} required /></label>
        <label>Starts at<input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({...form, starts_at: event.target.value})} required /></label>
        <label>Ends at<input type="datetime-local" value={form.ends_at} onChange={(event) => setForm({...form, ends_at: event.target.value})} required /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Create Shift" />
      </form>
    } />
  );
}
