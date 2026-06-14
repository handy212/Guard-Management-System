import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { SectionTabs } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function SettingsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <div className="page-stack">
      <SectionTabs
        items={[
          {key: "company", label: "Company"},
          {key: "branches", label: "Branches"},
          {key: "departments", label: "Departments"},
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "company" ? <ResourceCrudPage context={context} configKey="companySettings" /> : null}
      {activeTab === "branches" ? <ResourceCrudPage context={context} configKey="branches" /> : null}
      {activeTab === "departments" ? <ResourceCrudPage context={context} configKey="departments" /> : null}
    </div>
  );
}
