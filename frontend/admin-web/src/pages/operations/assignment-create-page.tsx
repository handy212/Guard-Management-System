import React, { useState } from "react";
import { createAssignment } from "../../api";
import { toOptions } from "../../lib/format";
import { FormActions, FormPage, SelectOptions } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function AssignmentCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({guard: "", shift: "", patrol_route: "", patrol_device: ""});
  return (
    <FormPage title="Create assignment" eyebrow="Operations" onCancel={() => context.navigate("operations/assignments")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createAssignment({
          guard: Number(form.guard),
          shift: Number(form.shift),
          patrol_route: form.patrol_route ? Number(form.patrol_route) : undefined,
          patrol_device: form.patrol_device ? Number(form.patrol_device) : undefined,
        }, context.token), "Assignment created.", () => {
          setForm({guard: "", shift: "", patrol_route: "", patrol_device: ""});
          context.navigate("operations/assignments");
        });
      }}>
        <label>Guard<SelectOptions value={form.guard} onChange={(value) => setForm({...form, guard: value})} options={(context.setupData?.guards ?? []).map((item) => ({value: String(item.id), label: `${item.first_name} ${item.last_name}`}))} required placeholder="Select guard" /></label>
        <label>Shift<SelectOptions value={form.shift} onChange={(value) => setForm({...form, shift: value})} options={toOptions(context.setupData?.shifts ?? [])} required placeholder="Select shift" /></label>
        <label>Route<SelectOptions value={form.patrol_route} onChange={(value) => setForm({...form, patrol_route: value})} options={toOptions(context.setupData?.routes ?? [])} placeholder="Optional" /></label>
        <label>Device<SelectOptions value={form.patrol_device} onChange={(value) => setForm({...form, patrol_device: value})} options={toOptions(context.setupData?.devices ?? [])} placeholder="Optional" /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Create Assignment" />
      </form>
    } />
  );
}
