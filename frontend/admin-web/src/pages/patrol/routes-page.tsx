import { ResourceCrudPage } from "../../components/resource-crud";
import { PageContext } from "../../types/ui";

export function RoutesPage({context}: {context: PageContext}) {
  return (
    <div className="page-stack">
      <ResourceCrudPage context={context} configKey="routes" />
      <ResourceCrudPage context={context} configKey="routeSteps" />
    </div>
  );
}
