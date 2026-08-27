import { resolveTableView } from "./tableView";
import type { DomainData, TableColumn } from "../../../shared/lib/results";
import type { Selection } from "../../../shared/lib/selection";

export interface ClickedRow {
  readonly row: Record<string, unknown>;
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
}

/** The row the reader opened, with the columns it was shown in, so the detail view can restate it. */
export function clickedRow(
  data: DomainData,
  selection: Selection,
  sliceRows: readonly unknown[],
): ClickedRow | null {
  if (selection.model === null) return null;
  const view = resolveTableView(
    { ...data, trajectory_by_genre: sliceRows as never },
    selection,
  );
  const row = (view.rows as Record<string, unknown>[]).find(
    (r) => r["model"] === selection.model,
  );
  if (row === undefined) return null;
  return { row, columns: view.columns };
}
