import type { Data, Layout } from "plotly.js";
import { baseLayout, PLOTLY_CONFIG, plotApi, TOKENS } from "../../../shared/charts";
import type { PlotApi } from "../../../shared/charts";
import { buildNetworkGraph, isEdgeDimmed, isNodeDimmed } from "../lib/network";
import { edgeSegments, layoutNetwork, neighborsOf } from "../lib/layout";
import type { Point } from "../lib/layout";
import type { MethodPayload } from "../../../shared/model";

/** Every tenth psalm carries a label, enough to orient without crowding 150 points. */
const LABEL_EVERY = 10;

/** A psalm outside the selection's neighbourhood, faded rather than hidden. */
const DIMMED_OPACITY = 0.12;

/** Edges away from the selection, faded further than the nodes, there being far more of them. */
const DIMMED_EDGE_OPACITY = 0.06;

/** The shared config plus a scroll wheel, this being the one view worth zooming into. */
const NETWORK_CONFIG = { ...PLOTLY_CONFIG, scrollZoom: true };

const NODE_SIZE = 9;
const SELECTED_NODE_SIZE = 15;

export interface NetworkOptions {
  readonly method: MethodPayload;
  readonly threshold: number;
  readonly colorOf: (psalm: number) => string;
  readonly onSelect: (psalm: number) => void;
  /** Positions from the last draw, so raising the threshold does not reshuffle the graph. */
  readonly previous?: ReadonlyMap<number, Point>;
}

/** The drawn network, plus what a redraw at a new threshold needs to carry forward. */
export interface NetworkPlot {
  readonly positions: ReadonlyMap<number, Point>;
  readonly edgeCount: number;
  setSelected: (psalm: number | null) => void;
  setColorOf: (colorOf: (psalm: number) => string) => void;
}

/** Marker colors, opacities and sizes for the current selection, dimming everything unconnected to it. */
export function markerStyle(
  psalmNumbers: readonly number[],
  colorOf: (psalm: number) => string,
  selected: number | null,
  neighbors: ReadonlyMap<number, ReadonlySet<number>>,
): { color: string[]; opacity: number[]; size: number[] } {
  return {
    color: psalmNumbers.map((psalm) => colorOf(psalm)),
    opacity: psalmNumbers.map((psalm) =>
      isNodeDimmed(psalm, selected, neighbors) ? DIMMED_OPACITY : 1,
    ),
    size: psalmNumbers.map((psalm) => (psalm === selected ? SELECTED_NODE_SIZE : NODE_SIZE)),
  };
}

/** Mounts the similarity network: d3 settles the positions, Plotly draws them once. */
export function mountNetwork(
  mount: HTMLElement,
  options: NetworkOptions,
  api: PlotApi = plotApi,
): Promise<NetworkPlot> {
  const { method, threshold, onSelect, previous } = options;
  let colorOf = options.colorOf;
  const graph = buildNetworkGraph(method, threshold);
  const positions = layoutNetwork(graph.nodes, graph.edges, previous);
  const neighbors = neighborsOf(graph.nodes, graph.edges);
  const psalmNumbers = graph.nodes.map((node) => node.id);
  const segments = edgeSegments(graph.edges, positions);
  const points = psalmNumbers.map((psalm) => positions.get(psalm) ?? { x: 0, y: 0 });
  const labelled = psalmNumbers.map((psalm) =>
    psalm % LABEL_EVERY === 0 ? String(psalm) : "",
  );

  const edgeTrace: Data = {
    type: "scatter",
    mode: "lines",
    x: segments.x,
    y: segments.y,
    line: { color: TOKENS.rule, width: 1 },
    hoverinfo: "skip",
    showlegend: false,
  } as unknown as Data;

  //: Empty until a psalm is chosen, then holding that psalm's own edges over the faded rest.
  const highlightTrace: Data = {
    type: "scatter",
    mode: "lines",
    x: [],
    y: [],
    line: { color: TOKENS.accent, width: 1 },
    hoverinfo: "skip",
    showlegend: false,
  } as unknown as Data;

  const nodeTrace: Data = {
    type: "scatter",
    mode: "markers+text",
    x: points.map((point) => point.x),
    y: points.map((point) => point.y),
    text: labelled,
    textposition: "top center",
    textfont: { family: TOKENS.mono, size: 10.5, color: TOKENS.inkFaint },
    customdata: psalmNumbers,
    marker: {
      ...markerStyle(psalmNumbers, colorOf, null, neighbors),
      line: { color: TOKENS.bgPanel, width: 1 },
    },
    hovertemplate: "Psalm %{customdata}<extra></extra>",
    showlegend: false,
  } as unknown as Data;

  const axis = { visible: false, showgrid: false, zeroline: false };
  const layout = baseLayout({
    xaxis: axis,
    yaxis: { ...axis, scaleanchor: "x" },
    margin: { l: 8, r: 8, t: 8, b: 8 },
    hovermode: "closest",
    dragmode: "pan",
  });

  return api
    .newPlot(
      mount,
      [edgeTrace, highlightTrace, nodeTrace],
      layout as Partial<Layout>,
      NETWORK_CONFIG,
    )
    .then((gd) => {
      let selected: number | null = null;

      gd.on("plotly_click", (event) => {
        const point = event.points[0];
        if (point === undefined) return;
        const psalm = point.customdata;
        if (typeof psalm === "number") onSelect(psalm);
      });

      const restyleNodes = (): void => {
        const style = markerStyle(psalmNumbers, colorOf, selected, neighbors);
        void api.restyle(
          gd,
          {
            "marker.color": [style.color],
            "marker.opacity": [style.opacity],
            "marker.size": [style.size],
          },
          [2],
        );
      };

      const restyleEdges = (): void => {
        const touching = graph.edges.filter(
          (edge) => !isEdgeDimmed(edge.source, edge.target, selected, neighbors),
        );
        //: Nothing to lift when every edge already qualifies, so the base trace stays lit.
        const lifting = touching.length < graph.edges.length;
        const highlight = lifting ? edgeSegments(touching, positions) : { x: [], y: [] };
        void api.restyle(
          gd,
          {
            opacity: [lifting ? DIMMED_EDGE_OPACITY : 1, 1],
            x: [segments.x, highlight.x],
            y: [segments.y, highlight.y],
          },
          [0, 1],
        );
      };

      return {
        positions,
        edgeCount: graph.edges.length,
        setSelected(psalm: number | null): void {
          selected = psalm;
          restyleNodes();
          restyleEdges();
        },
        setColorOf(next: (psalm: number) => string): void {
          colorOf = next;
          restyleNodes();
        },
      };
    });
}
