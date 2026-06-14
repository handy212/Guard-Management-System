import { useState } from "react";
import { ResourceCrudPage } from "../../components/resource-crud";
import { TabbedPage } from "../../components/page-shell";
import { PageContext } from "../../types/ui";

export function RolesPage({context}: {context: PageContext}) {
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <TabbedPage
      tabs={[
        {key: "roles", label: "Roles"},
        {key: "permissions", label: "Permissions"},
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "roles" ? <ResourceCrudPage context={context} configKey="roles" nested /> : null}
      {activeTab === "permissions" ? <ResourceCrudPage context={context} configKey="permissions" nested /> : null}
    </TabbedPage>
  );
}
