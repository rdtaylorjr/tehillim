import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import type { NetworkEdge, NetworkNode } from "./network";

/** Where one psalm sits in the laid-out network. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

interface SimNode extends SimulationNodeDatum {
  id: number;
}

//: Run to a stop rather than animated, since Plotly draws the result once rather than per tick.
const TICKS = 300;

//: Seeded so the same graph lays out the same way on every visit and in every test.
const SEED_RADIUS = 30;

/** Runs the force layout to rest and returns where each psalm landed. */
export function layoutNetwork(
  nodes: readonly NetworkNode[],
  edges: readonly NetworkEdge[],
  previous?: ReadonlyMap<number, Point>,
): Map<number, Point> {
  //: A ring rather than d3's own phyllotaxis, so a run carries no dependence on node order changing.
  const simNodes: SimNode[] = nodes.map((node, index) => {
    const held = previous?.get(node.id);
    if (held !== undefined) return { id: node.id, x: held.x, y: held.y };
    const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1);
    return {
      id: node.id,
      x: Math.cos(angle) * SEED_RADIUS,
      y: Math.sin(angle) * SEED_RADIUS,
    };
  });

  const links: SimulationLinkDatum<SimNode>[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  const simulation = forceSimulation(simNodes)
    .force("charge", forceManyBody().strength(-30))
    .force("collide", forceCollide<SimNode>(6))
    .force("x", forceX<SimNode>().strength(0.05))
    .force("y", forceY<SimNode>().strength(0.05))
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
        .id((node) => node.id)
        .distance(28)
        .strength(0.15),
    )
    .stop();

  simulation.tick(TICKS);

  return new Map(simNodes.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));
}

/** One polyline holding every edge, each pair separated by a gap so the segments stay apart. */
export function edgeSegments(
  edges: readonly NetworkEdge[],
  positions: ReadonlyMap<number, Point>,
): { x: (number | null)[]; y: (number | null)[] } {
  const x: (number | null)[] = [];
  const y: (number | null)[] = [];
  for (const edge of edges) {
    const from = positions.get(edge.source);
    const to = positions.get(edge.target);
    if (from === undefined || to === undefined) continue;
    x.push(from.x, to.x, null);
    y.push(from.y, to.y, null);
  }
  return { x, y };
}

/** Each psalm's directly connected psalms, read from both ends of every edge. */
export function neighborsOf(
  nodes: readonly NetworkNode[],
  edges: readonly NetworkEdge[],
): Map<number, Set<number>> {
  const neighbors = new Map(nodes.map((node) => [node.id, new Set<number>()]));
  for (const edge of edges) {
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
  }
  return neighbors;
}
