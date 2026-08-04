/** Largest value strictly off the diagonal, or 0 if there is none. */
export function maxOffDiagonal(matrix: number[][]): number {
  let max = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (i !== j && matrix[i][j] > max) max = matrix[i][j];
    }
  }
  return max;
}

/**
 * The value at `percentile` (0-100) among every distinct off-diagonal pair.
 *
 * Different similarity methods can have wildly different score
 * distributions (e.g. verb-morphology's baseline similarity runs far
 * higher than lexical's), so a fixed absolute threshold like 0.3 gives a
 * readable network graph for one method and an unreadable hairball for
 * another. Picking a threshold by percentile keeps the resulting edge
 * density comparable across methods.
 */
export function percentileOffDiagonal(matrix: number[][], percentile: number): number {
  const values: number[] = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix.length; j++) {
      values.push(matrix[i][j]);
    }
  }
  if (values.length === 0) return 0;

  values.sort((a, b) => a - b);
  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.ceil((percentile / 100) * values.length) - 1),
  );
  return values[index];
}
