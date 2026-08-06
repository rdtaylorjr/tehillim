import type { MethodPayload } from "../types";
import { bookOfPsalm } from "./books";

export interface NetworkNode {
  id: number;
  book: number;
}

export interface NetworkEdge {
  source: number;
  target: number;
  weight: number;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

/** Build a similarity network: one node per psalm, one edge per pair at or above `threshold`. */
export function buildNetworkGraph(
  method: MethodPayload,
  threshold: number,
): NetworkGraph {
  const numbers = method.psalmNumbers;

  const nodes: NetworkNode[] = numbers.map((id) => ({
    id,
    book: bookOfPsalm(id).index,
  }));

  const edges: NetworkEdge[] = [];
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const weight = method.matrix[i][j];
      if (weight >= threshold) {
        edges.push({ source: numbers[i], target: numbers[j], weight });
      }
    }
  }

  return { nodes, edges };
}

/** Whether node `id` should read as de-emphasized given the current
 * selection - true for every node outside the selected node's own
 * neighbor set, but only once that selection actually has a visible
 * neighbor (dimming the whole graph behind one edgeless dot is worse
 * than not dimming at all). */
export function isNodeDimmed(
  id: number,
  selected: number | null,
  neighbors: ReadonlyMap<number, ReadonlySet<number>>,
): boolean {
  if (selected === null || id === selected) return false;
  const neighborSet = neighbors.get(selected);
  if (!neighborSet || neighborSet.size === 0) return false;
  return !neighborSet.has(id);
}


/** Same de-emphasis rule as `isNodeDimmed`, for an edge: dimmed unless it
 * touches the selected node. */
export function isEdgeDimmed(
  source: number,
  target: number,
  selected: number | null,
  neighbors: ReadonlyMap<number, ReadonlySet<number>>,
): boolean {
  if (selected === null) return false;
  const neighborSet = neighbors.get(selected);
  if (!neighborSet || neighborSet.size === 0) return false;
  return source !== selected && target !== selected;
}
