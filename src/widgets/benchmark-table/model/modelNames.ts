import { resolveTableView } from "./tableView";
import { applyFacetFilter, applyTextFilter } from "./rowFilters";
import type { DomainData } from "../../../shared/lib/results";
import type { Selection } from "../../../shared/lib/navigation";

/** Every model the current selection holds, deduplicated, in the table's order. */
export function modelNames(
  data: DomainData,
  selection: Selection,
  sliceRows: readonly unknown[],
): string[] {
  const view = resolveTableView(
    { ...data, trajectory_by_genre: sliceRows as never },
    selection,
  );
  const faceted = applyFacetFilter(view.rows, selection.family, selection.facet);
  //: The name filter narrows the table, so it has no say over what a detail page may open.
  const named = applyTextFilter(faceted, selection.text)
    .map((row) => row.model)
    .filter((model): model is string => model !== undefined);
  return [...new Set(named)];
}
