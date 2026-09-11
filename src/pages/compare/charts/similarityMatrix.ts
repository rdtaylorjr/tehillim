import type { Data, Layout } from "plotly.js";
import {
  baseLayout,
  diagonalTrace,
  DIVERGING_COLORSCALE,
  PLOTLY_CONFIG,
  plotApi,
  TOKENS,
} from "../../../shared/charts";
import type { PlotApi } from "../../../shared/charts";
import { boundaryShapes, hoverTextGrid, valueGrid } from "../lib/matrix";
import type { MethodPayload } from "../../../shared/model";

/** The rule between books and the diagonal, in the page's own mid gray so neither reads as a value. */
const STRUCTURE_COLOR = TOKENS.inkFaint;

export interface SimilarityMatrixOptions {
  readonly method: MethodPayload;
  /** The value the ramp tops out at, past which every cell reads the same. */
  readonly domainMax: number;
  readonly boundaries: readonly number[];
  readonly onSelect: (psalm: number) => void;
}

/** Mounts the book-ordered NxN psalm matrix, a click on any cell selecting that row's psalm. */
export function mountSimilarityMatrix(
  mount: HTMLElement,
  options: SimilarityMatrixOptions,
  api: PlotApi = plotApi,
): Promise<void> {
  const { method, domainMax, boundaries, onSelect } = options;
  const psalmNumbers = method.psalmNumbers;
  const n = psalmNumbers.length;

  const trace: Data = {
    type: "heatmap",
    z: valueGrid(method.matrix),
    text: hoverTextGrid(psalmNumbers, method.matrix),
    zmin: 0,
    zmax: domainMax,
    colorscale: DIVERGING_COLORSCALE,
    colorbar: {
      orientation: "h",
      y: 0,
      yanchor: "top",
      ypad: 14,
      thickness: 10,
      len: 0.6,
      tickfont: { family: TOKENS.mono, size: 10.5, color: TOKENS.inkFaint },
      outlinewidth: 0,
    },
    hovertemplate: "%{text}<extra></extra>",
  } as unknown as Data;

  //: Unlabelled, the psalm a cell stands for being what the hover and the picker already say.
  const axis = {
    showticklabels: false,
    ticks: "",
    showgrid: false,
    zeroline: false,
    fixedrange: true,
    range: [-0.5, n - 0.5],
  };

  const layout = baseLayout({
    xaxis: axis,
    yaxis: { ...axis, autorange: "reversed", scaleanchor: "x" },
    shapes: boundaryShapes(boundaries, n, STRUCTURE_COLOR),
    margin: { l: 8, r: 8, t: 8, b: 54 },
  });

  return api
    .newPlot(
      mount,
      [trace, diagonalTrace(n, STRUCTURE_COLOR)],
      layout as Partial<Layout>,
      PLOTLY_CONFIG,
    )
    .then((gd) => {
      gd.on("plotly_click", (event) => {
        const point = event.points[0];
        if (point === undefined) return;
        const [row] = point.pointIndex as unknown as [number, number];
        const psalm = psalmNumbers[row];
        if (psalm !== undefined) onSelect(psalm);
      });
    });
}
