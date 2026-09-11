import type { Data } from "plotly.js";

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
