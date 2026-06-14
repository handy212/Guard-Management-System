import React, { useState } from "react";
import { createGuard } from "../../api";
import { FormActions, FormPage } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function GuardCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({employee_number: "", first_name: "", last_name: ""});
  return (
    <FormPage title="Create guard" eyebrow="Operations" onCancel={() => context.navigate("operations/guards")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createGuard(form, context.token), "Guard created.", () => {
          setForm({employee_number: "", first_name: "", last_name: ""});
          context.navigate("operations/guards");
        });
      }}>
        <label>Employee number<input value={form.employee_number} onChange={(event) => setForm({...form, employee_number: event.target.value})} required /></label>
        <label>First name<input value={form.first_name} onChange={(event) => setForm({...form, first_name: event.target.value})} required /></label>
        <label>Last name<input value={form.last_name} onChange={(event) => setForm({...form, last_name: event.target.value})} required /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Create Guard" />
      </form>
    } />
  );
}
