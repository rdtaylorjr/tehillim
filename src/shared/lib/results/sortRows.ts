export type SortDir = "asc" | "desc";

/** -Infinity for a missing value, so it sorts below every real one rather than unpredictably. */
const MISSING = -Infinity;

function asNumber(value: unknown): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : MISSING;
}

/**
 * Sorts a copy of rows by one field. The comparison is chosen per column rather than per cell:
 * a comparator that switched on each value could return NaN for a mixed column, which leaves
 * Array.prototype.sort's result undefined.
 */
export function sortRows<T extends object>(rows: readonly T[], key: string, dir: SortDir): T[] {
  const read = (row: T): unknown => (row as Record<string, unknown>)[key];
  const textual = rows.some((row) => typeof read(row) === "string");

  return [...rows].sort((a, b) => {
    if (textual) {
      const left = typeof read(a) === "string" ? (read(a) as string) : "";
      const right = typeof read(b) === "string" ? (read(b) as string) : "";
      return dir === "asc" ? left.localeCompare(right) : right.localeCompare(left);
    }
    const left = asNumber(read(a));
    const right = asNumber(read(b));
    return dir === "asc" ? left - right : right - left;
  });
}
