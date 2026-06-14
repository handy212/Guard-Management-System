import React, { useState } from "react";
import { GenericRecord } from "../../api";
import { DataTable, FilterBar, Panel } from "../../components/ui";
import { formatUnknown, humanize, stringifyRecord } from "../../lib/format";

type GenericSearchPageProps = {
  title: string;
  rows: GenericRecord[];
  emptyMessage: string;
  fields: string[];
  placeholder?: string;
};

export function GenericSearchPage({title, rows, emptyMessage, fields, placeholder}: GenericSearchPageProps) {
  const [query, setQuery] = useState("");
  const filteredRows = rows.filter((item) => stringifyRecord(item).includes(query.toLowerCase()));

  const columns = fields.map((field) => ({
    label: humanize(field),
    render: (row: GenericRecord) => formatUnknown(row[field]),
  }));

  return (
    <div className="page-stack">
      <Panel title={title}>
        <div className="resource-toolbar">
          <FilterBar query={query} setQuery={setQuery} placeholder={placeholder ?? `Filter ${title.toLowerCase()}…`} />
          <span className="resource-toolbar-meta">{filteredRows.length} shown</span>
        </div>
        <DataTable columns={columns} rows={filteredRows} emptyMessage={emptyMessage} />
      </Panel>
    </div>
  );
}
