import React, { useState } from "react";
import { createDevice } from "../../api";
import { toOptions } from "../../lib/format";
import { FormActions, FormPage, SelectOptions } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function DeviceCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({site: "", name: "", device_number: ""});
  return (
    <FormPage title="Register device" eyebrow="Patrol" onCancel={() => context.navigate("patrol/devices")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createDevice({...form, site: Number(form.site)}, context.token), "Device created.", () => {
          setForm({site: "", name: "", device_number: ""});
          context.navigate("patrol/devices");
        });
      }}>
        <label>Site<SelectOptions value={form.site} onChange={(value) => setForm({...form, site: value})} options={toOptions(context.setupData?.sites ?? [])} required placeholder="Select site" /></label>
        <label>Name<input value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} required /></label>
        <label>Device number<input value={form.device_number} onChange={(event) => setForm({...form, device_number: event.target.value})} required /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Register Device" />
      </form>
    } />
  );
}
