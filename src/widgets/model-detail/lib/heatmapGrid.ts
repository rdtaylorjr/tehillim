import type { HeatmapCell, PsalmOrderEntry } from "../model/types";

/** One tick position (the midpoint index of a contiguous genre run) and its genre label. */
export interface GenreTickAnchor {
  index: number;
  genre: string;
}

/** The [start, end) index range each genre occupies in a genre-grouped axis order. */
export function genreIndexRanges(
  order: PsalmOrderEntry[],
): Map<string, { start: number; end: number }> {
  const ranges = new Map<string, { start: number; end: number }>();
  let i = 0;
  while (i < order.length) {
    const entry = order[i];
    if (entry === undefined) break;
    const g = entry.genre;
    let j = i;
    while (order[j]?.genre === g) j++;
    ranges.set(g, { start: i, end: j });
    i = j;
  }
  return ranges;
}

/** One axis tick per genre, placed at that genre's contiguous run's midpoint index. */
export function genreTickAnchors(order: PsalmOrderEntry[]): GenreTickAnchor[] {
  const ranges = genreIndexRanges(order);
  const anchors: GenreTickAnchor[] = [];
  for (const [genre, { start, end }] of ranges) {
    anchors.push({ index: Math.floor((start + end - 1) / 2), genre });
  }
  return anchors;
}

/** The 90th percentile of absolute value, clipping outliers off a diverging color scale's domain. */
export function robustAbsClip(values: number[]): number {
  const sorted = values.map((v) => Math.abs(v)).sort((a, b) => a - b);
  const clip = sorted[Math.floor(sorted.length * 0.9)];
  return clip === undefined || clip === 0 ? 1e-6 : clip;
}

/** The z/text grids for a full pairwise heatmap: symmetric values, a self-labeled diagonal, explicit no-data cells. */
export function buildHeatmapGrid(
  cells: HeatmapCell[],
  order: PsalmOrderEntry[],
  valueTitle: string,
): { z: number[][]; text: string[][]; clipAbs: number } {
  const n = order.length;
  const psalmOf = order.map((o) => o.psalm);
  const psalmToIndex = new Map(order.map((o, i) => [o.psalm, i]));

  const z: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const text: string[][] = Array.from({ length: n }, () => new Array<string>(n).fill(""));

  /** Writes both orientations of a symmetric cell; indices come from psalmToIndex and are in range. */
  const putSymmetric = <T>(grid: T[][], a: number, b: number, value: T): void => {
    const rowA = grid[a];
    const rowB = grid[b];
    if (rowA !== undefined) rowA[b] = value;
    if (rowB !== undefined) rowB[a] = value;
  };

  for (let i = 0; i < n; i++) {
    const row = text[i];
    if (row !== undefined) row[i] = `Psalm ${String(psalmOf[i])}`;
  }

  const covered = new Set<number>();
  for (const c of cells) {
    const ia = psalmToIndex.get(c.psalm_a);
    const ib = psalmToIndex.get(c.psalm_b);
    if (ia === undefined || ib === undefined) continue;
    const line = `Psalm ${String(c.psalm_a)} vs ${String(c.psalm_b)}<br>${valueTitle}: ${c.value.toFixed(3)}`;
    putSymmetric(z, ia, ib, c.value);
    putSymmetric(text, ia, ib, line);
    covered.add(c.psalm_a);
    covered.add(c.psalm_b);
  }

  const missingPsalms = order.filter((o) => !covered.has(o.psalm));
  for (const o of missingPsalms) {
    const i = psalmToIndex.get(o.psalm);
    if (i === undefined) continue;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      putSymmetric(text, i, k, `Psalm ${String(o.psalm)} vs ${String(psalmOf[k])}<br>no data`);
    }
  }

  const clipAbs = robustAbsClip(cells.map((c) => c.value));
  return { z, text, clipAbs };
}

/** A Plotly rect shape spec, either a fill wash or a fill-less border. */
export interface FadeShape {
  type: "rect";
  xref: "x";
  yref: "y";
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  line: { color?: string; width: number };
  fillcolor: string;
  opacity?: number;
}

/** Fades everything outside the hovered cell's row-genre x column-genre block, with an optional exact-cell border. */
export function crossFadeShapes(
  n: number,
  rowBandLo: number,
  rowBandHi: number,
  colBandLo: number,
  colBandHi: number,
  rowIndex: number,
  colIndex: number,
  includeCellBorder: boolean,
  washColor: string,
  borderColor: string,
): FadeShape[] {
  const lo = -0.5;
  const hi = n - 0.5;
  const wash = (x0: number, x1: number, y0: number, y1: number): FadeShape => ({
    type: "rect",
    xref: "x",
    yref: "y",
    x0,
    x1,
    y0,
    y1,
    line: { width: 0 },
    fillcolor: washColor,
    opacity: 0.78,
  });
  const shapes: FadeShape[] = [
    wash(lo, hi, lo, rowBandLo),
    wash(lo, hi, rowBandHi, hi),
    wash(lo, colBandLo, rowBandLo, rowBandHi),
    wash(colBandHi, hi, rowBandLo, rowBandHi),
  ];
  if (includeCellBorder) {
    shapes.push({
      type: "rect",
      xref: "x",
      yref: "y",
      x0: colIndex - 0.5,
      x1: colIndex + 0.5,
      y0: rowIndex - 0.5,
      y1: rowIndex + 0.5,
      line: { color: borderColor, width: 2.5 },
      fillcolor: "rgba(0,0,0,0)",
    });
  }
  return shapes;
}
