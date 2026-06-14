import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { TabbedPage } from "../../components/page-shell";
import { PageContext } from "../../types/ui";

export function IncidentCenterPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("incidents");

  return (
    <TabbedPage
      tabs={[
        {key: "incidents", label: "Incidents"},
        {key: "complaints", label: "Complaints"},
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "incidents" ? <ResourceCrudPage context={context} configKey="incidents" nested /> : null}
      {activeTab === "complaints" ? <ResourceCrudPage context={context} configKey="complaints" nested /> : null}
    </TabbedPage>
  );
}
