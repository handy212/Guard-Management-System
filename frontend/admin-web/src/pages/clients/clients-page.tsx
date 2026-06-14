import { useEffect, useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { TabbedPage } from "../../components/page-shell";
import { recordFocusTab } from "../../lib/record-focus";
import { PageContext } from "../../types/ui";

export function ClientsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("clients");

  useEffect(() => {
    const tab = recordFocusTab(context.recordFocus);
    if (tab) {
      setActiveTab(tab);
    }
  }, [context.recordFocus]);

  return (
    <TabbedPage
      tabs={[
        {key: "clients", label: "Clients"},
        {key: "contacts", label: "Contacts"},
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "clients" ? <ResourceCrudPage context={context} configKey="clients" nested /> : null}
      {activeTab === "contacts" ? <ResourceCrudPage context={context} configKey="clientContacts" nested /> : null}
    </TabbedPage>
  );
}
