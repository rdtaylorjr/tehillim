/** Largest value strictly off the diagonal, or 0 if there is none. */
export function maxOffDiagonal(matrix: readonly (readonly number[])[]): number {
  let max = 0;
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row) continue;
    for (let j = 0; j < matrix.length; j++) {
      const value = row[j];
      if (i !== j && value !== undefined && value > max) max = value;
    }
  }
  return max;
}

/**
 * The value at `p` (0-100) among `values` - nearest-rank method (no
 * interpolation between adjacent values). Does not mutate its input.
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
}

/**
 * The value at `p` (0-100) among every distinct off-diagonal pair.
 *
 * Different similarity methods can have wildly different score distributions
 * (e.g. verb-morphology's baseline similarity runs far higher than lexical's),
 * so a fixed absolute threshold like 0.3 gives a readable network graph for one
 * method and an unreadable hairball for another. Picking a threshold by
 * percentile keeps the resulting edge density comparable across methods.
 */
export function percentileOffDiagonal(
  matrix: readonly (readonly number[])[],
  p: number,
): number {
  const values: number[] = [];
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row) continue;
    for (let j = i + 1; j < matrix.length; j++) {
      const value = row[j];
      if (value !== undefined) values.push(value);
    }
  }
  return percentile(values, p);
}
