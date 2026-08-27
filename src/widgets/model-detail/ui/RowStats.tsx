import styles from "./ModelDetail.module.css";
import { cellContent } from "../../../shared/ui/cellContent";
import type { TableColumn } from "../../../shared/lib/results";

export interface RowStatsProps<T extends object> {
  readonly row: T | null;
  readonly columns: readonly TableColumn<T>[];
}

/** The name is already in the breadcrumb, so it is not repeated here. */
const IDENTITY_LABELS = new Set(["Name"]);

/** Restates the clicked row's statistics, formatted exactly as the table formatted them. */
export function RowStats<T extends object>({
  row,
  columns,
}: RowStatsProps<T>): React.ReactElement | null {
  if (row === null) return null;
  const shown = columns.filter((column) => !IDENTITY_LABELS.has(column.label));
  return (
    <dl className={styles.rowStats}>
      {shown.map((column) => (
        <div className={styles.stat} key={column.label}>
          <dt className={styles.statLabel}>{column.label}</dt>
          <dd className={styles.statValue}>{cellContent(row, column)}</dd>
        </div>
      ))}
    </dl>
  );
}
