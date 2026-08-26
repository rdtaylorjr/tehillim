const UNAVAILABLE = "—";

/** 4-decimal p-value, matching validate_against_genre.py's CLI printer. */
export function formatPValue(p: number): string {
  return Number.isFinite(p) ? p.toFixed(4) : UNAVAILABLE;
}

/** 4-decimal FDR q-value, matching validate_against_genre.py's CLI printer. */
export function formatQValue(q: number): string {
  return Number.isFinite(q) ? q.toFixed(4) : UNAVAILABLE;
}
