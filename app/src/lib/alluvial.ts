/** Bipartite alluvial (Sankey-style) layout: source nodes on one side,
 * target nodes on the other, ribbons between them sized by count. Purpose-
 * built for the genre-alignment view (Gunkel category -> cluster) rather
 * than a general multi-stage Sankey - with exactly two fixed columns there
 * is no crossing-minimization or node-reordering problem to solve, so this
 * hand-rolled version stays a small, fully-tested pure function instead of
 * pulling in a general-purpose Sankey library for a shape it doesn't need.
 */

export interface AlluvialNode {
  label: string;
  /** Row/column total this node represents (a genre's total psalm count,
   * or a cluster's total size). */
  value: number;
  y0: number;
  y1: number;
}

export interface AlluvialLink {
  sourceIndex: number;
  targetIndex: number;
  value: number;
  sourceY0: number;
  sourceY1: number;
  targetY0: number;
  targetY1: number;
}

export interface AlluvialLayout {
  sourceNodes: AlluvialNode[];
  targetNodes: AlluvialNode[];
  links: AlluvialLink[];
}

export interface AlluvialInput {
  sourceLabels: readonly string[];
  targetLabels: readonly string[];
  /** counts[sourceIndex][targetIndex] */
  counts: readonly (readonly number[])[];
}

/** Stacks nodes top-to-bottom with height proportional to `totals`, over a
 * `height`-px budget shared with `gap`-px breathing room between every
 * pair of nodes that both have a nonzero total - a zero-total node (a
 * genre with no psalms at all in this context) collapses to y0 === y1 and
 * consumes no gap of its own, rather than leaving a visible empty slot. */
function stackNodes(
  labels: readonly string[],
  totals: readonly number[],
  height: number,
  gap: number,
  grandTotal: number,
): AlluvialNode[] {
  const nonZeroCount = totals.filter((total) => total > 0).length;
  const usableHeight = Math.max(height - gap * Math.max(nonZeroCount - 1, 0), 0);

  const nodes: AlluvialNode[] = [];
  let cursor = 0;
  for (let i = 0; i < labels.length; i++) {
    const total = totals[i];
    const nodeHeight = grandTotal > 0 ? (total / grandTotal) * usableHeight : 0;
    const y0 = cursor;
    const y1 = y0 + nodeHeight;
    nodes.push({ label: labels[i], value: total, y0, y1 });
    if (total > 0) cursor = y1 + gap;
  }
  return nodes;
}

function sum(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Lays out a genre x cluster (or any category x category) alluvial
 * diagram: node height proportional to row/column totals, link (ribbon)
 * width proportional to the shared count, each node's own span partitioned
 * exactly across its links in the order links are visited (source-major
 * for the source side, target-major for the target side) - no gaps or
 * overlaps within a single node's edge. */
export function computeAlluvialLayout(
  input: AlluvialInput,
  height: number,
  gap: number,
): AlluvialLayout {
  const { sourceLabels, targetLabels, counts } = input;
  const sourceTotals = sourceLabels.map((_, i) => sum(counts[i]));
  const targetTotals = targetLabels.map((_, j) => sum(sourceLabels.map((_, i) => counts[i][j])));
  const grandTotal = sum(sourceTotals);

  const sourceNodes = stackNodes(sourceLabels, sourceTotals, height, gap, grandTotal);
  const targetNodes = stackNodes(targetLabels, targetTotals, height, gap, grandTotal);

  const sourceCursor = sourceNodes.map((n) => n.y0);
  const targetCursor = targetNodes.map((n) => n.y0);
  const links: AlluvialLink[] = [];

  for (let i = 0; i < sourceLabels.length; i++) {
    if (sourceTotals[i] === 0) continue;
    for (let j = 0; j < targetLabels.length; j++) {
      const value = counts[i][j];
      if (value === 0 || targetTotals[j] === 0) continue;

      const sourceNode = sourceNodes[i];
      const sourceSpan = (sourceNode.y1 - sourceNode.y0) * (value / sourceTotals[i]);
      const sourceY0 = sourceCursor[i];
      const sourceY1 = sourceY0 + sourceSpan;
      sourceCursor[i] = sourceY1;

      const targetNode = targetNodes[j];
      const targetSpan = (targetNode.y1 - targetNode.y0) * (value / targetTotals[j]);
      const targetY0 = targetCursor[j];
      const targetY1 = targetY0 + targetSpan;
      targetCursor[j] = targetY1;

      links.push({ sourceIndex: i, targetIndex: j, value, sourceY0, sourceY1, targetY0, targetY1 });
    }
  }

  return { sourceNodes, targetNodes, links };
}
