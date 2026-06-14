import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { SectionTabs } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function ClientsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("clients");

  return (
    <div className="page-stack">
      <SectionTabs
        items={[
          {key: "clients", label: "Register"},
          {key: "contacts", label: "Contacts"},
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "clients" ? <ResourceCrudPage context={context} configKey="clients" /> : null}
      {activeTab === "contacts" ? <ResourceCrudPage context={context} configKey="clientContacts" /> : null}
    </div>
  );
}
