import { ResourceCrudPage } from "../../components/resource-crud";
import { PageContext } from "../../types/ui";

export function CheckpointsPage({context}: {context: PageContext}) {
  return <ResourceCrudPage context={context} configKey="checkpoints" />;
}
