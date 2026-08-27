import { formatNumber } from "../lib/results";
import type { TableColumn } from "../lib/results";
import { significancePill } from "./Pill";

/** Values with no text form render blank rather than as "undefined". */
function asText(value: unknown): React.ReactNode {
  return typeof value === "string" || typeof value === "number" ? value : "";
}

/** One cell's rendered value, shared so a statistic reads identically wherever it appears. */
export function cellContent<T extends object>(row: T, column: TableColumn<T>): React.ReactNode {
  if (column.render) return column.render(row);
  const raw = (row as Record<string, unknown>)[column.key];
  if (column.type === "pill") return significancePill(raw as number, column.pillPrefix);
  if (column.type === "num") return formatNumber(raw as number, column.digits);
  return asText(raw);
}
