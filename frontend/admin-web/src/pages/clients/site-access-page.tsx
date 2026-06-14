import { ResourceCrudPage } from "../../components/resource-crud";
import { SplitGrid } from "../../components/page-shell";
import { PageContext } from "../../types/ui";

export function SiteAccessPage({context}: {context: PageContext}) {
  return (
    <div className="page-stack">
      <SplitGrid>
        <ResourceCrudPage context={context} configKey="siteInstructions" nested />
        <ResourceCrudPage context={context} configKey="siteEmergencyContacts" nested />
      </SplitGrid>
    </div>
  );
}
