import Plotly from "plotly.js-dist-min";
import type { Data, Layout } from "plotly.js";

/** Plotly is an external dependency, so every mount takes it as a parameter a test can substitute. */
export type PlotFn = (
  mount: HTMLElement,
  traces: Data[],
  layout: Partial<Layout>,
  config: Record<string, unknown>,
) => Promise<Plotly.PlotlyHTMLElement>;

export const plotly: PlotFn = (mount, traces, layout, config) =>
  Plotly.newPlot(mount, traces, layout, config);
