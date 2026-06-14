import { useEffect, useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { TabbedPage } from "../../components/page-shell";
import { recordFocusTab } from "../../lib/record-focus";
import { PageContext } from "../../types/ui";

export function GuardsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("guards");

  useEffect(() => {
    const tab = recordFocusTab(context.recordFocus);
    if (tab) {
      setActiveTab(tab);
    }
  }, [context.recordFocus]);

  return (
    <TabbedPage
      tabs={[
        {key: "guards", label: "Directory"},
        {key: "next-of-kin", label: "Next of kin"},
        {key: "documents", label: "Documents"},
        {key: "training", label: "Training"},
        {key: "uniform", label: "Uniform"},
        {key: "discipline", label: "Discipline"},
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "guards" ? <ResourceCrudPage context={context} configKey="guards" nested /> : null}
      {activeTab === "next-of-kin" ? <ResourceCrudPage context={context} configKey="guardNextOfKin" nested /> : null}
      {activeTab === "documents" ? <ResourceCrudPage context={context} configKey="guardDocuments" nested /> : null}
      {activeTab === "training" ? <ResourceCrudPage context={context} configKey="guardTrainingRecords" nested /> : null}
      {activeTab === "uniform" ? <ResourceCrudPage context={context} configKey="uniformIssues" nested /> : null}
      {activeTab === "discipline" ? <ResourceCrudPage context={context} configKey="disciplinaryRecords" nested /> : null}
    </TabbedPage>
  );
}
