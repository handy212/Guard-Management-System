import React, { useState } from "react";
import { GenericRecord } from "../../api";
import { stringifyRecord } from "../../lib/format";
import { FilterBar, GenericRecordTable } from "../../components/ui";

type GenericSearchPageProps = {
  title: string;
  eyebrow: string;
  rows: GenericRecord[];
  emptyMessage: string;
  fields: string[];
  helper: string;
  placeholder?: string;
};

export function GenericSearchPage({
  title,
  eyebrow,
  rows,
  emptyMessage,
  fields,
  helper,
  placeholder,
}: GenericSearchPageProps) {
  const [query, setQuery] = useState("");
  const filteredRows = rows.filter((item) => stringifyRecord(item).includes(query.toLowerCase()));

  return (
    <div className="page-stack">
      <FilterBar query={query} setQuery={setQuery} placeholder={placeholder ?? `Search ${title.toLowerCase()}`} helper={helper} />
      <GenericRecordTable eyebrow={eyebrow} title={title} rows={filteredRows} emptyMessage={emptyMessage} fields={fields} />
    </div>
  );
}
