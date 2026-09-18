import { sourceFor } from "../../../shared/lib/corpus";
import { resolveRegister } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";
import type { TableColumn } from "../../../shared/lib/results";
import {
  genreByGenreColumns,
  genreOverallColumns,
  parallelismByTypeColumns,
  parallelismOverallColumns,
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

/** The section, columns and headline metric for one toolbar permutation. */
export function resolveTableView(data: DomainData, selection: Selection): TableView {
  if (selection.benchmark === "parallelism") {
    if (selection.parallelismType === "all") {
      return view(data.parallelism_overall, parallelismOverallColumns(), "separation_auc");
    }
    const rows = data.parallelism_by_type.filter((r) => r.scope === selection.parallelismType);
    return view(rows, parallelismByTypeColumns(), "separation_auc");
  }

  const register = resolveRegister(data.genre_registers, selection);
  const category = sourceFor(selection.source).category;
  //: The register in view, and no model scored under another source or unit.
  const inRegister = (r: { taxonomy: string; unit: string | null }): boolean =>
    register !== null && r.taxonomy === register.taxonomy && r.unit === register.unit;
  if (selection.genre === "all") {
    const rows = data.genre_overall.filter(inRegister);
    return view(rows, genreOverallColumns(category), "separation_auc");
  }
  const rows = data.genre_by_genre.filter((r) => inRegister(r) && r.genre === selection.genre);
  return view(rows, genreByGenreColumns(category), "separation_auc");
}
