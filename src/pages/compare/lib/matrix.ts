/** A Plotly line shape drawn in matrix coordinates. */
export interface MatrixShape {
  readonly type: "line";
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
  readonly xref: "x" | "paper";
  readonly yref: "y" | "paper";
  readonly line: { readonly color: string; readonly width: number };
}

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

/** A rule between the two cells each boundary divides, run the full width and height. */
export function boundaryShapes(
  boundaries: readonly number[],
  n: number,
  color: string,
): MatrixShape[] {
  return boundaries.flatMap((boundary) => {
    const at = boundary - 0.5;
    return [
      {
        type: "line" as const,
        x0: at,
        x1: at,
        y0: -0.5,
        y1: n - 0.5,
        xref: "x" as const,
        yref: "y" as const,
        line: { color, width: 1 },
      },
      {
        type: "line" as const,
        x0: -0.5,
        x1: n - 0.5,
        y0: at,
        y1: at,
        xref: "x" as const,
        yref: "y" as const,
        line: { color, width: 1 },
      },
    ];
  });
}
