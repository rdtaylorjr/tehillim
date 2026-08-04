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
