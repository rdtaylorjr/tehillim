import { useMemo, useState } from "react";
import type { Selection } from "../../../shared/lib/selection";
import { pathSentence } from "../../../shared/lib/path";
import type { SortDir } from "../../../shared/lib/results";
import { applyFacetFilter, applyNameFilter, applyTextFilter } from "../model/rowFilters";
import type { DomainData } from "../../../shared/lib/results";
import { resolveTableView } from "../model/tableView";
import { Message } from "../../../shared/ui/Message";
import { ResultsTable } from "./ResultsTable";

export interface BenchmarkTableProps {
  readonly selection: Selection;
  readonly data: DomainData;
  readonly onOpenModel: (model: string) => void;
}

/** The results for one toolbar permutation, sorted by whichever column the reader last chose. */
export function BenchmarkTable({
  selection,
  data,
  onOpenModel,
}: BenchmarkTableProps): React.ReactElement {
  const view = useMemo(() => resolveTableView(data, selection), [data, selection]);
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);

  const rows = useMemo(() => {
    const faceted = applyFacetFilter(view.rows, selection.family, selection.facet);
    const texted = applyTextFilter(faceted, selection.text);
    return applyNameFilter(texted, selection.query.trim());
  }, [view.rows, selection.family, selection.facet, selection.text, selection.query]);

  // A sort chosen for one permutation rarely names a column of the next, so each starts fresh.
  const active =
    sort && view.columns.some((column) => column.key === sort.key)
      ? sort
      : { key: view.defaultSortKey, dir: "desc" as SortDir };

  if (rows.length === 0) {
    return (
      <Message>
        No models match {selection.query ? `“${selection.query}”` : "this selection"}.
      </Message>
    );
  }

  return (
    <ResultsTable
      caption={`${pathSentence(selection)}: ${String(rows.length)} rows`}
      rows={rows}
      columns={view.columns}
      sortKey={active.key}
      sortDir={active.dir}
      onSort={(key) => {
        setSort({
          key,
          dir: key === active.key && active.dir === "desc" ? "asc" : "desc",
        });
      }}
      onOpenModel={onOpenModel}
    />
  );
}
