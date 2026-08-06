import { describe, expect, it } from "vitest";
import type { MethodPayload } from "../types";
import { buildNetworkGraph, isEdgeDimmed, isNodeDimmed } from "./network";

function makeMethod(): MethodPayload {
  return {
    id: "lexical-tfidf-cosine",
    description: "",
    psalmNumbers: [1, 2, 3],
    psalmStats: [],
    similar: {},
    matrix: [
      [1, 0.8, 0.1],
      [0.8, 1, 0.05],
      [0.1, 0.05, 1],
    ],
  };
}

describe("buildNetworkGraph", () => {
  it("creates one node per psalm", () => {
    const graph = buildNetworkGraph(makeMethod(), 0);
    expect(graph.nodes.map((n) => n.id)).toEqual([1, 2, 3]);
  });

  it("assigns each node its traditional book", () => {
    const graph = buildNetworkGraph(makeMethod(), 0);
    expect(graph.nodes[0].book).toBe(1);
  });

  it("only includes edges at or above the threshold", () => {
    const graph = buildNetworkGraph(makeMethod(), 0.5);
    expect(graph.edges).toEqual([{ source: 1, target: 2, weight: 0.8 }]);
  });

  it("excludes all edges when threshold exceeds every off-diagonal score", () => {
    const graph = buildNetworkGraph(makeMethod(), 0.99);
    expect(graph.edges).toEqual([]);
  });

  it("never emits a self-edge or a duplicate mirrored edge", () => {
    const graph = buildNetworkGraph(makeMethod(), 0);
    expect(graph.edges).toHaveLength(3); // 3 choose 2, not 6
    for (const edge of graph.edges) {
      expect(edge.source).not.toBe(edge.target);
    }
  });

  it("includes edges exactly at the threshold boundary", () => {
    const graph = buildNetworkGraph(makeMethod(), 0.8);
    expect(graph.edges).toContainEqual({ source: 1, target: 2, weight: 0.8 });
  });
});

describe("isNodeDimmed", () => {
  const neighbors = new Map([
    [1, new Set([2])],
    [2, new Set([1])],
    [3, new Set<number>()],
  ]);

  it("dims a node outside the selection's neighbor set", () => {
    expect(isNodeDimmed(3, 1, neighbors)).toBe(true);
  });

  it("does not dim the selected node itself", () => {
    expect(isNodeDimmed(1, 1, neighbors)).toBe(false);
  });

  it("does not dim a neighbor of the selected node", () => {
    expect(isNodeDimmed(2, 1, neighbors)).toBe(false);
  });

  it("dims nothing when nothing is selected", () => {
    expect(isNodeDimmed(3, null, neighbors)).toBe(false);
  });

  it("dims nothing when the selected node has no visible neighbors", () => {
    // Dimming the whole graph behind one edgeless dot is worse than not
    // dimming at all.
    expect(isNodeDimmed(1, 3, neighbors)).toBe(false);
  });

  it("treats a selection missing from the map the same as no neighbors", () => {
    expect(isNodeDimmed(1, 99, neighbors)).toBe(false);
  });
});

describe("isEdgeDimmed", () => {
  const neighbors = new Map([
    [1, new Set([2])],
    [3, new Set<number>()],
  ]);

  it("dims an edge that touches neither endpoint of the selection", () => {
    expect(isEdgeDimmed(2, 3, 1, neighbors)).toBe(true);
  });

  it("does not dim an edge touching the selected node as source", () => {
    expect(isEdgeDimmed(1, 2, 1, neighbors)).toBe(false);
  });

  it("does not dim an edge touching the selected node as target", () => {
    expect(isEdgeDimmed(2, 1, 1, neighbors)).toBe(false);
  });

  it("dims nothing when nothing is selected", () => {
    expect(isEdgeDimmed(2, 3, null, neighbors)).toBe(false);
  });

  it("dims nothing when the selected node has no visible neighbors", () => {
    expect(isEdgeDimmed(1, 2, 3, neighbors)).toBe(false);
  });
});
