import type { MethodPayload } from "../../../shared/model";

export interface NetworkNode {
  id: number;
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
export function buildNetworkGraph(method: MethodPayload, threshold: number): NetworkGraph {
  const numbers = method.psalmNumbers;

  const nodes: NetworkNode[] = numbers.map((id) => ({ id }));

  const edges: NetworkEdge[] = [];
  for (let i = 0; i < numbers.length; i++) {
    const row = method.matrix[i];
    const source = numbers[i];
    if (!row || source === undefined) continue;
    for (let j = i + 1; j < numbers.length; j++) {
      const weight = row[j];
      const target = numbers[j];
      if (weight === undefined || target === undefined) continue;
      if (weight >= threshold) {
        edges.push({ source, target, weight });
      }
    }
  }

  return { nodes, edges };
}

/** True for a node outside the selection's neighbours, once it has a visible one. */
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

/** The same rule as `isNodeDimmed`, for an edge touching the selection. */
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
