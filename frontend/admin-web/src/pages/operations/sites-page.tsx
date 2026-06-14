import { ResourceCrudPage } from "../../components/resource-crud";
import { PageContext } from "../../types/ui";

export function SitesPage({context}: {context: PageContext}) {
  return <ResourceCrudPage context={context} configKey="sites" />;
}
