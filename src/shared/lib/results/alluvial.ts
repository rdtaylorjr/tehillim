/** Bipartite alluvial layout, two fixed columns with ribbons sized by count. */

export interface AlluvialNode {
  label: string;
  /** The row or column total this node represents. */
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

/** Stacks nodes by total over a height budget, a zero total consuming no gap. */
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
    const label = labels[i];
    const total = totals[i];
    if (label === undefined || total === undefined) continue;
    const nodeHeight = grandTotal > 0 ? (total / grandTotal) * usableHeight : 0;
    const y0 = cursor;
    const y1 = y0 + nodeHeight;
    nodes.push({ label, value: total, y0, y1 });
    if (total > 0) cursor = y1 + gap;
  }
  return nodes;
}

function sum(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Lays out a category by category alluvial, each node's span partitioned across its links. */
export function computeAlluvialLayout(
  input: AlluvialInput,
  height: number,
  gap: number,
): AlluvialLayout {
  const { sourceLabels, targetLabels, counts } = input;
  const sourceTotals = sourceLabels.map((_, i) => sum(counts[i] ?? []));
  const targetTotals = targetLabels.map((_, j) =>
    sum(sourceLabels.map((_, i) => counts[i]?.[j] ?? 0)),
  );
  const grandTotal = sum(sourceTotals);

  const sourceNodes = stackNodes(sourceLabels, sourceTotals, height, gap, grandTotal);
  const targetNodes = stackNodes(targetLabels, targetTotals, height, gap, grandTotal);

  const sourceCursor = sourceNodes.map((n) => n.y0);
  const targetCursor = targetNodes.map((n) => n.y0);
  const links: AlluvialLink[] = [];

  for (let i = 0; i < sourceLabels.length; i++) {
    const sourceTotal = sourceTotals[i] ?? 0;
    const sourceNode = sourceNodes[i];
    const row = counts[i];
    if (sourceTotal === 0 || !sourceNode || !row) continue;

    for (let j = 0; j < targetLabels.length; j++) {
      const value = row[j] ?? 0;
      const targetTotal = targetTotals[j] ?? 0;
      const targetNode = targetNodes[j];
      if (value === 0 || targetTotal === 0 || !targetNode) continue;

      const sourceY0 = sourceCursor[i] ?? sourceNode.y0;
      const sourceY1 = sourceY0 + (sourceNode.y1 - sourceNode.y0) * (value / sourceTotal);
      sourceCursor[i] = sourceY1;

      const targetY0 = targetCursor[j] ?? targetNode.y0;
      const targetY1 = targetY0 + (targetNode.y1 - targetNode.y0) * (value / targetTotal);
      targetCursor[j] = targetY1;

      links.push({
        sourceIndex: i,
        targetIndex: j,
        value,
        sourceY0,
        sourceY1,
        targetY0,
        targetY1,
      });
    }
  }

  return { sourceNodes, targetNodes, links };
}
