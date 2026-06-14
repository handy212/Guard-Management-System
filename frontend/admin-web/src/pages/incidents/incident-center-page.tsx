import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { SectionTabs } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function IncidentCenterPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("incidents");

  return (
    <div className="page-stack">
      <SectionTabs
        items={[
          {key: "incidents", label: "Incidents"},
          {key: "complaints", label: "Complaints"},
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "incidents" ? <ResourceCrudPage context={context} configKey="incidents" /> : null}
      {activeTab === "complaints" ? <ResourceCrudPage context={context} configKey="complaints" /> : null}
    </div>
  );
}
