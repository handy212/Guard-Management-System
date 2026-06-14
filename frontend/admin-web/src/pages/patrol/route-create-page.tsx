import React, { useState } from "react";
import { createRoute } from "../../api";
import { toOptions } from "../../lib/format";
import { FormActions, FormPage, SelectOptions } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function RouteCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({site: "", name: "", code: ""});
  return (
    <FormPage title="Create patrol route" eyebrow="Patrol" onCancel={() => context.navigate("patrol/routes")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createRoute({...form, site: Number(form.site)}, context.token), "Route created.", () => {
          setForm({site: "", name: "", code: ""});
          context.navigate("patrol/routes");
        });
      }}>
        <label>Site<SelectOptions value={form.site} onChange={(value) => setForm({...form, site: value})} options={toOptions(context.setupData?.sites ?? [])} required placeholder="Select site" /></label>
        <label>Name<input value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} required /></label>
        <label>Code<input value={form.code} onChange={(event) => setForm({...form, code: event.target.value})} required /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Create Route" />
      </form>
    } />
  );
}
