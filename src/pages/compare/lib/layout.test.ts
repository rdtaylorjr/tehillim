import { describe, expect, it } from "vitest";
import { edgeSegments, layoutNetwork, neighborsOf } from "./layout";
import type { NetworkEdge, NetworkNode } from "./network";

const NODES: NetworkNode[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
const EDGES: NetworkEdge[] = [
  { source: 1, target: 2, weight: 0.9 },
  { source: 2, target: 3, weight: 0.8 },
];

describe("layoutNetwork", () => {
  it("places every node", () => {
    const placed = layoutNetwork(NODES, EDGES);
    expect([...placed.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("gives every node a finite position, so no point is dropped by the renderer", () => {
    for (const point of layoutNetwork(NODES, EDGES).values()) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });

  it("settles to the same layout twice, since a seeded run has no randomness left", () => {
    const first = layoutNetwork(NODES, EDGES);
    const second = layoutNetwork(NODES, EDGES);
    expect([...second.entries()]).toEqual([...first.entries()]);
  });

  it("starts a node from where the previous layout left it, so a threshold change does not reshuffle", () => {
    const held = new Map([
      [1, { x: 500, y: 500 }],
      [2, { x: 0, y: 0 }],
      [3, { x: -10, y: -10 }],
    ]);
    const warm = layoutNetwork(NODES, [], held);
    const cold = layoutNetwork(NODES, []);
    const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
      Math.hypot(a.x - b.x, a.y - b.y);
    expect(distance(warm.get(1)!, held.get(1)!)).toBeLessThan(
      distance(cold.get(1)!, held.get(1)!),
    );
  });

  it("places an isolated node rather than leaving it out", () => {
    expect(layoutNetwork(NODES, []).size).toBe(3);
  });
});

describe("edgeSegments", () => {
  const positions = new Map([
    [1, { x: 0, y: 0 }],
    [2, { x: 1, y: 1 }],
    [3, { x: 2, y: 4 }],
  ]);

  it("breaks the line between one edge and the next with a gap", () => {
    const { x, y } = edgeSegments(EDGES, positions);
    expect(x).toEqual([0, 1, null, 1, 2, null]);
    expect(y).toEqual([0, 1, null, 1, 4, null]);
  });

  it("drops an edge whose endpoint was never placed, rather than drawing to nowhere", () => {
    const { x } = edgeSegments([{ source: 1, target: 9, weight: 1 }], positions);
    expect(x).toEqual([]);
  });

  it("draws nothing for no edges", () => {
    expect(edgeSegments([], positions)).toEqual({ x: [], y: [] });
  });
});

describe("neighborsOf", () => {
  it("records each edge from both ends, the graph being undirected", () => {
    const neighbors = neighborsOf(NODES, EDGES);
    expect([...(neighbors.get(2) ?? [])].sort((a, b) => a - b)).toEqual([1, 3]);
  });

  it("gives an unconnected node an empty set rather than nothing", () => {
    expect(neighborsOf(NODES, []).get(1)).toEqual(new Set());
  });
});
