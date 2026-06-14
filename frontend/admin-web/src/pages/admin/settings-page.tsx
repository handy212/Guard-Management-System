import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { TabbedPage } from "../../components/page-shell";
import { PageContext } from "../../types/ui";

export function SettingsPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("company");

  return (
    <TabbedPage
      tabs={[
        {key: "company", label: "Company"},
        {key: "branches", label: "Branches"},
        {key: "departments", label: "Departments"},
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "company" ? <ResourceCrudPage context={context} configKey="companySettings" nested /> : null}
      {activeTab === "branches" ? <ResourceCrudPage context={context} configKey="branches" nested /> : null}
      {activeTab === "departments" ? <ResourceCrudPage context={context} configKey="departments" nested /> : null}
    </TabbedPage>
  );
}
