import { useMemo } from "react";
import styles from "./ResultsTable.module.css";
import { sortRows } from "../../../shared/lib/results";
import type { SortDir, TableColumn } from "../../../shared/lib/results";
import { cellContent } from "../../../shared/ui/cellContent";

export interface ResultsTableProps<T extends object> {
  /** States which selection produced these rows, for a reader who cannot see the toolbar. */
  readonly caption: string;
  readonly rows: readonly T[];
  readonly columns: readonly TableColumn<T>[];
  readonly sortKey: string;
  readonly sortDir: SortDir;
  readonly onSort: (key: string) => void;
  readonly onOpenModel: (model: string) => void;
}

function headerClass<T>(column: TableColumn<T>, sortKey: string, sortDir: SortDir): string {
  const classes = column.type === "num" || column.type === "pill" ? [styles.num] : [];
  if (column.key === sortKey)
    classes.push(sortDir === "asc" ? styles.sortedAsc : styles.sortedDesc);
  return classes.join(" ");
}

const isModelColumn = (key: string): boolean => key === "model" || key === "model_base";

/**
 * Rows are not identified by model alone: a trajectory row repeats one model once per source,
 * and a by-type row once per scope. A duplicate key leaves React reusing the wrong cells.
 */
const IDENTITY = ["model", "source", "scope", "genre", "metric"] as const;

function rowKey(row: Record<string, unknown>, index: number): string {
  const parts = IDENTITY.map((field) => row[field]).filter(
    (value): value is string => typeof value === "string",
  );
  if (parts.length > 0) return parts.join("|");
  if (import.meta.env.DEV) {
    console.warn("Row has no identifying field; falling back to an index key", row);
  }
  return String(index);
}

/** Text cells hold plain scalars; anything else has no sensible string form. */
function asText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  return "";
}

function cellClass<T>(column: TableColumn<T>): string {
  if (column.type === "num" || column.type === "pill") return styles.num;
  return isModelColumn(column.key) ? styles.modelCell : "";
}

/** One results table: sorted rows, sort-indicator classes, and each column's cell rule. */
export function ResultsTable<T extends object>({
  caption,
  rows,
  columns,
  sortKey,
  sortDir,
  onSort,
  onOpenModel,
}: ResultsTableProps<T>): React.ReactElement {
  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);

  return (
    <div className={styles.tblWrap}>
      <table className={styles.results}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={headerClass(column, sortKey, sortDir)}
                aria-sort={
                  column.key === sortKey
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <button
                  type="button"
                  className={styles.colSort}
                  onClick={() => {
                    onSort(column.key);
                  }}
                >
                  {column.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => {
            const fields = row as Record<string, unknown>;
            const model = asText(fields["model"]);
            return (
              <tr key={rowKey(fields, index)}>
                {columns.map((column) => (
                  <td key={column.key} className={cellClass(column)}>
                    {isModelColumn(column.key) ? (
                      <button
                        type="button"
                        className={styles.rowOpen}
                        onClick={() => {
                          onOpenModel(model);
                        }}
                      >
                        {cellContent(row, column)}
                      </button>
                    ) : (
                      cellContent(row, column)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
