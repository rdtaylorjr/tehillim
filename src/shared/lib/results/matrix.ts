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

/** The value at `p` among `values` by nearest rank, without mutating the input. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
}

/** The value at `p` among off-diagonal pairs, keeping edge density comparable. */
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
