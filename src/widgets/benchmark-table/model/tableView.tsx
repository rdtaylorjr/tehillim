import type { Selection } from "../../../shared/lib/selection";
import type { TableColumn } from "../../../shared/lib/results";
import {
  genreByGenreColumns,
  genreOverallColumns,
  parallelismByTypeColumns,
  parallelismOverallColumns,
  trajectoryByGenreColumns,
  trajectoryOverallColumns,
} from "./tableColumns";
import type { DomainData, ResultRow } from "../../../shared/lib/results";

/** One resolved table: which rows, which columns, and which metric leads it. */
export interface TableView {
  rows: readonly ResultRow[];
  columns: readonly TableColumn<ResultRow>[];
  defaultSortKey: string;
}

/** The one cast in the module: each column set is built for exactly the rows paired with it. */
const view = <T extends object>(
  rows: T[],
  columns: TableColumn<T>[],
  sortKey: string,
): TableView => ({
  rows: rows as ResultRow[],
  columns: columns as unknown as TableColumn<ResultRow>[],
  defaultSortKey: sortKey,
});

/**
 * The section, columns and headline metric for one toolbar permutation. The genre benchmark
 * splits by metric: "genre" reads the discrimination tables, any other metric the trajectory ones.
 */
export function resolveTableView(data: DomainData, selection: Selection): TableView {
  if (selection.benchmark === "parallelism") {
    if (selection.parallelismType === "all") {
      return view(data.parallelism_overall, parallelismOverallColumns(), "separation_auc");
    }
    const rows = data.parallelism_by_type.filter((r) => r.scope === selection.parallelismType);
    return view(rows, parallelismByTypeColumns(), "separation_auc");
  }

  if (selection.metric === "genre") {
    if (selection.genre === "all") {
      return view(data.genre_overall, genreOverallColumns(), "separation_auc");
    }
    const rows = data.genre_by_genre.filter((r) => r.genre === selection.genre);
    return view(rows, genreByGenreColumns(), "separation_auc");
  }

  if (selection.genre === "all") {
    const rows = data.trajectory.filter((r) => r.metric === selection.metric);
    return view(rows, trajectoryOverallColumns(rows), "raw_effect_size");
  }
  const rows = data.trajectory_by_genre.filter(
    (r) => r.metric === selection.metric && r.genre === selection.genre,
  );
  return view(rows, trajectoryByGenreColumns(), "gap");
}
