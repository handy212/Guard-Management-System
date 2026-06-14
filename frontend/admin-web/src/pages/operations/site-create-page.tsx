import React, { useState } from "react";
import { createSite } from "../../api";
import { toOptions } from "../../lib/format";
import { FormActions, FormPage, SelectOptions } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function SiteCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({client: "", name: "", code: "", required_guards: "1"});
  return (
    <FormPage title="Create site" eyebrow="Operations" onCancel={() => context.navigate("operations/sites")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createSite({...form, client: Number(form.client), required_guards: Number(form.required_guards)}, context.token), "Site created.", () => {
          setForm({client: "", name: "", code: "", required_guards: "1"});
          context.navigate("operations/sites");
        });
      }}>
        <label>Client<SelectOptions value={form.client} onChange={(value) => setForm({...form, client: value})} options={toOptions(context.setupData?.clients ?? [])} required placeholder="Select client" /></label>
        <label>Name<input value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} required /></label>
        <label>Code<input value={form.code} onChange={(event) => setForm({...form, code: event.target.value})} required /></label>
        <label>Required guards<input type="number" min="1" value={form.required_guards} onChange={(event) => setForm({...form, required_guards: event.target.value})} required /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Create Site" />
      </form>
    } />
  );
}
