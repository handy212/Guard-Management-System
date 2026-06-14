import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { SectionTabs } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function RolesPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <div className="page-stack">
      <SectionTabs
        items={[
          {key: "roles", label: "Roles"},
          {key: "permissions", label: "Permissions"},
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "roles" ? <ResourceCrudPage context={context} configKey="roles" /> : null}
      {activeTab === "permissions" ? <ResourceCrudPage context={context} configKey="permissions" /> : null}
    </div>
  );
}
