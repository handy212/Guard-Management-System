import { PageContext } from "../../types/ui";
import { GenericSearchPage } from "../shared/generic-search-page";

export function AuditLogsPage({context}: {context: PageContext}) {
  return <GenericSearchPage title="Audit trail" eyebrow="Administration" rows={context.supportData?.auditLogs ?? []} emptyMessage="No audit log records are available." fields={["actor", "action", "target_model", "target_id", "created_at"]} helper="This first pass keeps audit logs dense, readable, and list-first." />;
}
