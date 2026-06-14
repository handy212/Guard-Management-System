import { ResourceCrudPage } from "../../components/resource-crud";
import { SplitGrid } from "../../components/page-shell";
import { PageContext } from "../../types/ui";

export function RoutesPage({context}: {context: PageContext}) {
  return (
    <div className="page-stack">
      <SplitGrid>
        <ResourceCrudPage context={context} configKey="routes" nested />
        <ResourceCrudPage context={context} configKey="routeSteps" nested />
      </SplitGrid>
    </div>
  );
}
