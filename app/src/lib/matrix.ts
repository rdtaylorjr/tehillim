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
