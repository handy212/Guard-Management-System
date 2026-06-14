import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { TabbedPage } from "../../components/page-shell";
import { PageContext } from "../../types/ui";

export function AssignmentsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("assignments");

  return (
    <TabbedPage
      tabs={[
        {key: "assignments", label: "Assignments"},
        {key: "attendance", label: "Attendance"},
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "assignments" ? <ResourceCrudPage context={context} configKey="assignments" nested /> : null}
      {activeTab === "attendance" ? <ResourceCrudPage context={context} configKey="attendance" nested /> : null}
    </TabbedPage>
  );
}
