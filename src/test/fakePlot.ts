import type { PlotApi } from "../shared/charts";

/** Stands in for Plotly's graph div, recording handlers so a test can fire them. */
export class FakeGraph {
  readonly handlers = new Map<string, (event: unknown) => void>();
  readonly restyles: { update: Record<string, unknown>; traceIndices: number[] }[] = [];

  on(event: string, handler: (payload: unknown) => void): void {
    this.handlers.set(event, handler);
  }

  fire(event: string, payload: unknown): void {
    this.handlers.get(event)?.(payload);
  }
}

/** A plot seam that records every call instead of drawing, jsdom having no canvas to draw on. */
export function capturePlot(): { api: PlotApi; calls: unknown[]; graph: FakeGraph } {
  const calls: unknown[] = [];
  const graph = new FakeGraph();
  const api: PlotApi = {
    newPlot: (_mount, traces, layout, config) => {
      calls.push({ traces, layout, config });
      return Promise.resolve(graph as never);
    },
    restyle: (_graph, update, traceIndices) => {
      graph.restyles.push({ update, traceIndices });
      return Promise.resolve(undefined);
    },
  };
  return { api, calls, graph };
}
