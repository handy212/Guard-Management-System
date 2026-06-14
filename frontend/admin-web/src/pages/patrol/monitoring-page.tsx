import React, { useState } from "react";
import { AssignmentCard } from "../../api";
import { ResourceCrudPage } from "../../components/resource-crud";
import { formatDate, formatTime } from "../../lib/format";
import { DataTable, FilterBar, Panel, SectionTabs, StatusBadge } from "../../components/ui";
import { PageContext } from "../../types/ui";

export function MonitoringPage({context, compact}: {context: PageContext; compact: boolean}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("board");
  const rows = (context.overview?.assignment_board ?? []).filter((item) => {
    const haystack = `${item.site_name} ${item.guard_name} ${item.shift_name} ${item.device_name ?? ""} ${item.route_name ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="page-stack">
      <SectionTabs
        items={[
          {key: "board", label: "Monitoring Board"},
          {key: "records", label: "Patrol Records"},
          {key: "exceptions", label: "Exceptions"},
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "board" ? (
        <>
      <FilterBar query={query} setQuery={setQuery} placeholder="Filter by site, guard, shift, route, or device" helper={compact ? "This view doubles as the assignment control board for v1." : "Use this board as the live patrol monitoring center in the current MVP."} />
      <Panel eyebrow="Monitoring" title="Deployment and patrol board">
        <DataTable
          columns={[
            {label: "Site", render: (row: AssignmentCard) => <><strong>{row.site_name}</strong><div className="table-subtle">{row.client_name}</div></>},
            {label: "Guard", render: (row: AssignmentCard) => row.guard_name},
            {label: "Shift", render: (row: AssignmentCard) => <><strong>{row.shift_name}</strong><div className="table-subtle">{formatDate(row.shift_starts_at)} to {formatTime(row.shift_ends_at)}</div></>},
            {label: "Attendance", render: (row: AssignmentCard) => <StatusBadge value={row.attendance_status} />},
            {label: "Patrol", render: (row: AssignmentCard) => <StatusBadge value={row.patrol_status} detail={`${row.patrol_record_count} records`} />},
            {label: "Route", render: (row: AssignmentCard) => row.route_name ?? "Route missing"},
            {label: "Device", render: (row: AssignmentCard) => row.device_name ?? "Unassigned"},
            {label: "Exceptions", render: (row: AssignmentCard) => row.open_exception_count},
          ]}
          rows={rows}
          emptyMessage="No assignment rows match the current filters."
        />
      </Panel>
        </>
      ) : null}
      {activeTab === "records" ? <ResourceCrudPage context={context} configKey="patrolRecords" /> : null}
      {activeTab === "exceptions" ? <ResourceCrudPage context={context} configKey="patrolExceptions" /> : null}
    </div>
  );
}
