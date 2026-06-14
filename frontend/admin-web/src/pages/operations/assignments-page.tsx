import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { SectionTabs } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function AssignmentsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("assignments");

  return (
    <div className="page-stack">
      <SectionTabs
        items={[
          {key: "assignments", label: "Assignments"},
          {key: "attendance", label: "Attendance"},
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "assignments" ? <ResourceCrudPage context={context} configKey="assignments" /> : null}
      {activeTab === "attendance" ? <ResourceCrudPage context={context} configKey="attendance" /> : null}
    </div>
  );
}
