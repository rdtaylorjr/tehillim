import Plotly from "plotly.js-dist-min";
import type { Data, Layout } from "plotly.js";

/** Plotly is an external dependency, so every mount takes it as a parameter a test can substitute. */
export type PlotFn = (
  mount: HTMLElement,
  traces: Data[],
  layout: Partial<Layout>,
  config: Record<string, unknown>,
) => Promise<Plotly.PlotlyHTMLElement>;

/** The other half of the seam: what a chart uses to restyle traces it already drew. */
export type RestyleFn = (
  graph: Plotly.PlotlyHTMLElement,
  update: Record<string, unknown>,
  traceIndices: number[],
) => Promise<unknown>;

/** Both calls together, for a chart that updates itself after the first draw. */
export interface PlotApi {
  readonly newPlot: PlotFn;
  readonly restyle: RestyleFn;
}

export const plotly: PlotFn = (mount, traces, layout, config) =>
  Plotly.newPlot(mount, traces, layout, config);

export const restylePlot: RestyleFn = (graph, update, traceIndices) =>
  Plotly.restyle(graph, update, traceIndices);

export const plotApi: PlotApi = { newPlot: plotly, restyle: restylePlot };
