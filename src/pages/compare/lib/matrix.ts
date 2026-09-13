/** The matrix with an empty diagonal, so a psalm against itself reads as a gap rather than a peak. */
export function valueGrid(matrix: readonly (readonly number[])[]): (number | null)[][] {
  return matrix.map((row, i) => row.map((value, j) => (i === j ? null : value)));
}

/** One hover label per cell: the psalm alone on the diagonal, both psalms and the score off it. */
export function hoverTextGrid(
  psalmNumbers: readonly number[],
  matrix: readonly (readonly number[])[],
): string[][] {
  return psalmNumbers.map((rowPsalm, row) =>
    psalmNumbers.map((colPsalm, col) => {
      if (row === col) return `Psalm ${String(rowPsalm)}`;
      const value = matrix[row]?.[col];
      if (value === undefined) return "";
      return `Psalm ${String(rowPsalm)} & Psalm ${String(colPsalm)}<br>${value.toFixed(3)} similarity`;
    }),
  );
}
