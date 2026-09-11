import { describe, expect, it, vi } from "vitest";
import { mountSimilarityMatrix } from "./similarityMatrix";
import { markerStyle, mountNetwork } from "./network";
import { capturePlot } from "../../../test/fakePlot";
import type { MethodPayload } from "../../../shared/model";

const METHOD: MethodPayload = {
  id: "lexical",
  label: "Lexical",
  description: "A description",
  psalmNumbers: [1, 2, 3],
  matrix: [
    [1, 0.5, 0.25],
    [0.5, 1, 0.75],
    [0.25, 0.75, 1],
  ],
} as unknown as MethodPayload;

const options = {
  method: METHOD,
  domainMax: 1,
  boundaries: [2],
  onSelect: () => undefined,
};

describe("mountSimilarityMatrix", () => {
  it("hands Plotly an unchanging payload", async () => {
    const { api, calls } = capturePlot();
    await mountSimilarityMatrix(document.createElement("div"), options, api);
    expect(calls).toMatchSnapshot();
  });

  it("selects the clicked cell's row psalm, not its column", async () => {
    const onSelect = vi.fn();
    const { api, graph } = capturePlot();
    await mountSimilarityMatrix(document.createElement("div"), { ...options, onSelect }, api);
    graph.fire("plotly_click", { points: [{ pointIndex: [2, 0] }] });
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("ignores a click carrying no point, rather than throwing", async () => {
    const onSelect = vi.fn();
    const { api, graph } = capturePlot();
    await mountSimilarityMatrix(document.createElement("div"), { ...options, onSelect }, api);
    graph.fire("plotly_click", { points: [] });
    expect(onSelect).not.toHaveBeenCalled();
  });
});

const networkOptions = {
  method: METHOD,
  threshold: 0.4,
  colorOf: (psalm: number) => `#00000${String(psalm)}`,
  onSelect: () => undefined,
};

describe("mountNetwork", () => {
  it("hands Plotly an unchanging payload", async () => {
    const { api, calls } = capturePlot();
    await mountNetwork(document.createElement("div"), networkOptions, api);
    expect(calls).toMatchSnapshot();
  });

  it("reports the edges it drew, so the page can say how many are shown", async () => {
    const { api } = capturePlot();
    const plot = await mountNetwork(document.createElement("div"), networkOptions, api);
    //: Only the 0.5 and 0.75 pairs clear the threshold, the diagonal never being an edge.
    expect(plot.edgeCount).toBe(2);
  });

  it("selects the clicked psalm", async () => {
    const onSelect = vi.fn();
    const { api, graph } = capturePlot();
    await mountNetwork(document.createElement("div"), { ...networkOptions, onSelect }, api);
    graph.fire("plotly_click", { points: [{ customdata: 2 }] });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("ignores a click on a point carrying no psalm, rather than selecting a stray value", async () => {
    const onSelect = vi.fn();
    const { api, graph } = capturePlot();
    await mountNetwork(document.createElement("div"), { ...networkOptions, onSelect }, api);
    graph.fire("plotly_click", { points: [{ customdata: undefined }] });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("restyles the nodes and the edges when the selection changes, and nothing else", async () => {
    const { api, graph } = capturePlot();
    const plot = await mountNetwork(document.createElement("div"), networkOptions, api);
    plot.setSelected(2);
    expect(graph.restyles.map((r) => r.traceIndices)).toEqual([[2], [0, 1]]);
    expect(graph.restyles[0]?.update).toHaveProperty("marker.color");
  });

  it("lifts the selection's own edges over the faded rest", async () => {
    const { api, graph } = capturePlot();
    const plot = await mountNetwork(document.createElement("div"), networkOptions, api);
    plot.setSelected(1);
    const edges = graph.restyles[1]?.update as { opacity: number[]; x: unknown[][] };
    expect(edges.opacity[0]).toBeLessThan(1);
    //: Psalm 1 touches one of the two edges, so the lifted trace carries that one segment.
    expect(edges.x[1]).toHaveLength(3);
  });

  it("leaves every edge lit when the selection reaches all of them", async () => {
    const { api, graph } = capturePlot();
    const plot = await mountNetwork(document.createElement("div"), networkOptions, api);
    plot.setSelected(2);
    const edges = graph.restyles[1]?.update as { opacity: number[]; x: unknown[][] };
    expect(edges.opacity[0]).toBe(1);
    expect(edges.x[1]).toEqual([]);
  });

  it("recolors in place, so a color change never moves the layout", async () => {
    const { api, graph } = capturePlot();
    const plot = await mountNetwork(document.createElement("div"), networkOptions, api);
    plot.setColorOf(() => "#ffffff");
    expect(graph.restyles).toHaveLength(1);
    const update = graph.restyles[0]?.update as { "marker.color": string[][] };
    expect(update["marker.color"][0]).toEqual(["#ffffff", "#ffffff", "#ffffff"]);
  });
});

describe("markerStyle", () => {
  const neighbors = new Map([
    [1, new Set([2])],
    [2, new Set([1])],
    [3, new Set<number>()],
  ]);
  const color = (psalm: number): string => `#${String(psalm)}`;

  it("leaves every psalm at full strength when nothing is selected", () => {
    expect(markerStyle([1, 2, 3], color, null, neighbors).opacity).toEqual([1, 1, 1]);
  });

  it("fades a psalm the selection does not reach, keeping the selection and its neighbours", () => {
    expect(markerStyle([1, 2, 3], color, 1, neighbors).opacity).toEqual([1, 1, 0.12]);
  });

  it("enlarges the selected psalm, so it is found among the rest", () => {
    const size = markerStyle([1, 2, 3], color, 2, neighbors).size;
    expect(size[1]).toBeGreaterThan(size[0]!);
  });
});
