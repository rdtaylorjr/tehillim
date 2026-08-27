/** The color for a named ROC/PR series: accent for Combined, its palette color, or a fallback. */
export function seriesColor(
  name: string,
  palette: Record<string, string>,
  accentColor: string,
  fallbackColor: string,
): string {
  if (name === "Combined") return accentColor;
  return palette[name] ?? fallbackColor;
}

const REFERENCE_KEYS = ["baseline", "different"];

/** Reorders raincloud/curve groups: combined first, then the canonical breakdown order, reference group last. */
export function orderGroups<T extends { key: string }>(
  groups: T[],
  canonicalOrder: string[],
): T[] {
  const reference = groups.filter((g) => REFERENCE_KEYS.includes(g.key));
  const combined = groups.filter((g) => g.key === "combined");
  const byKey = new Map(groups.map((g) => [g.key, g]));
  const rest = canonicalOrder
    .filter((key) => key !== "combined")
    .map((key) => byKey.get(key))
    .filter((group): group is T => group !== undefined);
  return [...combined, ...rest, ...reference];
}
