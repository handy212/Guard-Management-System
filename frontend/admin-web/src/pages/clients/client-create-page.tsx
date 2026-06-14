import React, { useState } from "react";
import { createClient } from "../../api";
import { FormActions, FormPage } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function ClientCreatePage({context}: {context: PageContext}) {
  const [form, setForm] = useState({name: "", code: ""});
  return (
    <FormPage title="Create client" eyebrow="Clients" onCancel={() => context.navigate("clients/clients")} form={
      <form className="form-grid" onSubmit={(event) => {
        event.preventDefault();
        void context.runAction(() => createClient(form, context.token), "Client created.", () => {
          setForm({name: "", code: ""});
          context.navigate("clients/clients");
        });
      }}>
        <label>Name<input value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} required /></label>
        <label>Code<input value={form.code} onChange={(event) => setForm({...form, code: event.target.value})} required /></label>
        <FormActions submitting={context.isSubmitting} submitLabel="Create Client" />
      </form>
    } />
  );
}
