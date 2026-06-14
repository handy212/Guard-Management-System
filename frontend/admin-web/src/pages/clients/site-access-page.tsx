import { ResourceCrudPage } from "../../components/resource-crud";
import { PageContext } from "../../types/ui";

export function SiteAccessPage({context}: {context: PageContext}) {
  return (
    <div className="dashboard-grid">
      <ResourceCrudPage context={context} configKey="siteInstructions" />
      <ResourceCrudPage context={context} configKey="siteEmergencyContacts" />
    </div>
  );
}
