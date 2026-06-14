import React, { useState } from "react";
import { createRouteCheckpoint } from "../../api";
import { toOptions } from "../../lib/format";
import { FormActions, FormPage, SelectOptions } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function RouteStepCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({route: "", checkpoint: "", sequence: "1", expected_offset_minutes: "0"});
  return (
    <FormPage title="Add route step" eyebrow="Patrol" onCancel={() => context.navigate("patrol/routes")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createRouteCheckpoint({
          route: Number(form.route),
          checkpoint: Number(form.checkpoint),
          sequence: Number(form.sequence),
          expected_offset_minutes: Number(form.expected_offset_minutes),
        }, context.token), "Route step created.", () => {
          setForm({route: "", checkpoint: "", sequence: "1", expected_offset_minutes: "0"});
          context.navigate("patrol/routes");
        });
      }}>
        <label>Route<SelectOptions value={form.route} onChange={(value) => setForm({...form, route: value})} options={toOptions(context.setupData?.routes ?? [])} required placeholder="Select route" /></label>
        <label>Checkpoint<SelectOptions value={form.checkpoint} onChange={(value) => setForm({...form, checkpoint: value})} options={toOptions(context.setupData?.checkpoints ?? [])} required placeholder="Select checkpoint" /></label>
        <label>Sequence<input type="number" min="1" value={form.sequence} onChange={(event) => setForm({...form, sequence: event.target.value})} required /></label>
        <label>Offset minutes<input type="number" min="0" value={form.expected_offset_minutes} onChange={(event) => setForm({...form, expected_offset_minutes: event.target.value})} required /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Add Route Step" />
      </form>
    } />
  );
}
