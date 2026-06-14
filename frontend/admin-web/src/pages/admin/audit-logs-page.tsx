import { GenericSearchPage } from "../shared/generic-search-page";
import { PageContext } from "../../types/ui";

export function AuditLogsPage({context}: {context: PageContext}) {
  return (
    <GenericSearchPage
      title="Audit log"
      rows={context.supportData?.auditLogs ?? []}
      emptyMessage="No audit entries yet."
      fields={["action", "entity_type", "entity_id", "summary", "created_at"]}
      placeholder="Filter audit entries…"
    />
  );
}
