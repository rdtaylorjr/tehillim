import {
  DIVERGING_COLORSCALE,
  PLOTLY_CONFIG,
  TOKENS,
  baseLayout,
  diagonalTrace,
  plotly,
} from "../../../shared/charts";
import type { PlotFn } from "../../../shared/charts";
import * as Plotly from "plotly.js-dist-min";
import type { Data, Layout } from "plotly.js";
import {
  buildHeatmapGrid,
  crossFadeShapes,
  genreIndexRanges,
  genreTickAnchors,
  robustAbsClip,
} from "../lib/heatmapGrid";
import type { GenreMeanCell, HeatmapCell, PsalmOrderEntry } from "../model/types";

/** The diagonal is structure, not a reading, so it wears the page's own mid gray. */
const STRUCTURE_COLOR = TOKENS.inkFaint;

/** Every label around a matrix wears the face the table hangs a model's text variant off. */
const LABEL_FONT = { family: TOKENS.mono, size: 10.5, color: TOKENS.inkFaint };

const AXIS_COMMON = {
  tickfont: LABEL_FONT,
  showgrid: false,
  zeroline: false,
  fixedrange: true,
};

/** Mounts the full n x n pairwise psalm matrix, genre-grouped, with quadrant-fade + single-cell-border hover. */
export function mountHeatmap(
  mount: HTMLElement,
  cells: HeatmapCell[],
  order: PsalmOrderEntry[],
  valueTitle: string,
  plot: PlotFn = plotly,
): void {
  const n = order.length;
  const genreOf = order.map((o) => o.genre);
  const { z, text, clipAbs } = buildHeatmapGrid(cells, order, valueTitle);
  const indexRanges = genreIndexRanges(order);
  const anchors = genreTickAnchors(order);

  const trace: Data = {
    type: "heatmap",
    z,
    text,
    zmin: -clipAbs,
    zmax: clipAbs,
    zmid: 0,
    colorscale: DIVERGING_COLORSCALE,
    colorbar: {
      title: { text: valueTitle, font: LABEL_FONT },
      tickfont: LABEL_FONT,
      len: 0.85,
      outlinewidth: 0,
    },
    hovertemplate: "%{text}<extra></extra>",
  } as unknown as Data;

  const axisCommon = {
    ...AXIS_COMMON,
    tickvals: anchors.map((a) => a.index),
    ticktext: anchors.map((a) => a.genre),
    range: [-0.65, n - 0.35],
  };
  const gridSize = 800;
  const margin = { l: 90, r: 130, t: 10, b: 70 };
  const layout = baseLayout({
    xaxis: { ...axisCommon, tickangle: -40 },
    yaxis: { ...axisCommon, autorange: "reversed" },
    margin,
    width: gridSize + margin.l + margin.r,
    height: gridSize + margin.t + margin.b,
  });

  void plot(
    mount,
    [trace, diagonalTrace(n, STRUCTURE_COLOR)],
    layout as Partial<Layout>,
    PLOTLY_CONFIG,
  ).then((gd) => {
    gd.on("plotly_hover", (ev) => {
      const pt = ev.points[0];
      if (!pt?.pointIndex) return;
      const [rowIndex, colIndex] = pt.pointIndex as unknown as [number, number];
      const rowGenre = genreOf[rowIndex];
      const colGenre = genreOf[colIndex];
      if (rowGenre === undefined || colGenre === undefined) return;
      const rowR = indexRanges.get(rowGenre);
      const colR = indexRanges.get(colGenre);
      if (rowR === undefined || colR === undefined) return;
      const dynamic = crossFadeShapes(
        n,
        rowR.start - 0.5,
        rowR.end - 0.5,
        colR.start - 0.5,
        colR.end - 0.5,
        rowIndex,
        colIndex,
        true,
        TOKENS.bgPanel,
        TOKENS.accent,
      );
      void Plotly.relayout(gd, { shapes: dynamic });
    });
    gd.on("plotly_unhover", () => {
      void Plotly.relayout(gd, { shapes: [] });
    });
  });
}

/** Mounts the reduced genre x genre mean-value summary matrix, same diverging scale and hover-fade behavior. */
export function mountGenreMeanMatrix(
  mount: HTMLElement,
  cells: GenreMeanCell[],
  genreList: string[],
  valueTitle: string,
  plot: PlotFn = plotly,
): void {
  const n = genreList.length;
  const idx = new Map(genreList.map((g, i) => [g, i]));
  const z: (number | null)[][] = Array.from({ length: n }, () =>
    new Array<number | null>(n).fill(null),
  );
  const custom: ([string, string] | null)[][] = Array.from({ length: n }, () =>
    new Array<[string, string] | null>(n).fill(null),
  );
  for (const c of cells) {
    const rowI = idx.get(c.genre_b);
    const colI = idx.get(c.genre_a);
    if (rowI === undefined || colI === undefined) continue;
    const zRow = z[rowI];
    const customRow = custom[rowI];
    if (zRow === undefined || customRow === undefined) continue;
    zRow[colI] = c.value;
    customRow[colI] = [c.genre_a, c.genre_b];
  }
  const clipAbs = robustAbsClip(cells.map((c) => c.value));

  const trace: Data = {
    type: "heatmap",
    z,
    customdata: custom,
    zmin: -clipAbs,
    zmax: clipAbs,
    zmid: 0,
    colorscale: DIVERGING_COLORSCALE,
    colorbar: {
      title: { text: valueTitle, font: LABEL_FONT },
      tickfont: LABEL_FONT,
      len: 0.85,
      outlinewidth: 0,
    },
    hoverongaps: false,
    hovertemplate: `%{customdata[0]} vs. %{customdata[1]}<br>${valueTitle}: %{z:.3f}<extra></extra>`,
    xgap: 2,
    ygap: 2,
  } as Data;

  const axisCommon = {
    ...AXIS_COMMON,
    tickvals: genreList.map((_, i) => i),
    ticktext: genreList,
    range: [-0.65, n - 0.35],
  };
  const gridSize = 280;
  const margin = { l: 90, r: 130, t: 10, b: 70 };
  const layout = baseLayout({
    xaxis: { ...axisCommon, tickangle: -40 },
    yaxis: { ...axisCommon, autorange: "reversed" },
    margin,
    width: gridSize + margin.l + margin.r,
    height: gridSize + margin.t + margin.b,
  });

  //: No gray diagonal here: a genre against itself is its within-genre mean, a reading in its own right.
  void plot(mount, [trace], layout as Partial<Layout>, PLOTLY_CONFIG).then((gd) => {
    gd.on("plotly_hover", (ev) => {
      const pt = ev.points[0];
      if (pt?.customdata === null || pt?.customdata === undefined) return;
      const [rowIndex, colIndex] = pt.pointIndex as unknown as [number, number];
      const dynamic = crossFadeShapes(
        n,
        rowIndex - 0.5,
        rowIndex + 0.5,
        colIndex - 0.5,
        colIndex + 0.5,
        rowIndex,
        colIndex,
        false,
        TOKENS.bgPanel,
        TOKENS.accent,
      );
      void Plotly.relayout(gd, { shapes: dynamic });
    });
    gd.on("plotly_unhover", () => {
      void Plotly.relayout(gd, { shapes: [] });
    });
  });
}
