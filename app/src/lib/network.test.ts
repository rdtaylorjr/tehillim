import { describe, expect, it } from "vitest";
import type { SimilarityPayload } from "../types";
import { buildNetworkGraph } from "./network";

function makePayload(): SimilarityPayload {
  return {
    meta: {
      method: "lexical-tfidf-cosine",
      description: "",
      corpus: { name: "ETCBC/BHSA", version: "2021" },
      generatedAt: "2026-01-01T00:00:00Z",
      psalmCount: 3,
    },
    psalmNumbers: [1, 2, 3],
    psalms: [],
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
    const graph = buildNetworkGraph(makePayload(), 0);
    expect(graph.nodes.map((n) => n.id)).toEqual([1, 2, 3]);
  });

  it("assigns each node its traditional book", () => {
    const graph = buildNetworkGraph(makePayload(), 0);
    expect(graph.nodes[0].book).toBe(1);
  });

  it("only includes edges at or above the threshold", () => {
    const graph = buildNetworkGraph(makePayload(), 0.5);
    expect(graph.edges).toEqual([{ source: 1, target: 2, weight: 0.8 }]);
  });

  it("excludes all edges when threshold exceeds every off-diagonal score", () => {
    const graph = buildNetworkGraph(makePayload(), 0.99);
    expect(graph.edges).toEqual([]);
  });

  it("never emits a self-edge or a duplicate mirrored edge", () => {
    const graph = buildNetworkGraph(makePayload(), 0);
    expect(graph.edges).toHaveLength(3); // 3 choose 2, not 6
    for (const edge of graph.edges) {
      expect(edge.source).not.toBe(edge.target);
    }
  });

  it("includes edges exactly at the threshold boundary", () => {
    const graph = buildNetworkGraph(makePayload(), 0.8);
    expect(graph.edges).toContainEqual({ source: 1, target: 2, weight: 0.8 });
  });
});
