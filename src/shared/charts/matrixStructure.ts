import type { Data } from "plotly.js";

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

/** The index of every cell whose label differs from the one before it, where a rule belongs. */
export function labelBoundaries(labels: readonly string[]): number[] {
  return labels.flatMap((label, i) => (i > 0 && label !== labels[i - 1] ? [i] : []));
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

/** A grid holding the diagonal alone, every other cell empty so the matrix beneath shows through. */
export function diagonalGrid(n: number): (number | null)[][] {
  return Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, col) => (row === col ? 1 : null)),
  );
}

/** The diagonal drawn over a matrix in one flat gray, a psalm against itself being structure rather than a reading. */
export function diagonalTrace(n: number, color: string): Data {
  return {
    type: "heatmap",
    z: diagonalGrid(n),
    colorscale: [
      [0, color],
      [1, color],
    ],
    showscale: false,
    hoverinfo: "skip",
  } as unknown as Data;
}
