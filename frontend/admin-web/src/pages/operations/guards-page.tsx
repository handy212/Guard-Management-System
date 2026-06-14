import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { SectionTabs } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function GuardsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("guards");

  return (
    <div className="page-stack">
      <SectionTabs
        items={[
          {key: "guards", label: "Directory"},
          {key: "next-of-kin", label: "Next of Kin"},
          {key: "documents", label: "Documents"},
          {key: "training", label: "Training"},
          {key: "uniform", label: "Uniform"},
          {key: "discipline", label: "Discipline"},
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "guards" ? <ResourceCrudPage context={context} configKey="guards" /> : null}
      {activeTab === "next-of-kin" ? <ResourceCrudPage context={context} configKey="guardNextOfKin" /> : null}
      {activeTab === "documents" ? <ResourceCrudPage context={context} configKey="guardDocuments" /> : null}
      {activeTab === "training" ? <ResourceCrudPage context={context} configKey="guardTrainingRecords" /> : null}
      {activeTab === "uniform" ? <ResourceCrudPage context={context} configKey="uniformIssues" /> : null}
      {activeTab === "discipline" ? <ResourceCrudPage context={context} configKey="disciplinaryRecords" /> : null}
    </div>
  );
}
