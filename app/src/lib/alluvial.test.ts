import { describe, expect, it } from "vitest";
import { computeAlluvialLayout } from "./alluvial";

describe("computeAlluvialLayout", () => {
  it("sizes nodes proportionally to their totals", () => {
    const layout = computeAlluvialLayout(
      { sourceLabels: ["A", "B"], targetLabels: ["X", "Y"], counts: [[3, 1], [0, 2]] },
      60,
      0,
    );
    expect(layout.sourceNodes[0]).toMatchObject({ label: "A", value: 4, y0: 0, y1: 40 });
    expect(layout.sourceNodes[1]).toMatchObject({ label: "B", value: 2, y0: 40, y1: 60 });
    expect(layout.targetNodes[0]).toMatchObject({ label: "X", value: 3, y0: 0, y1: 30 });
    expect(layout.targetNodes[1]).toMatchObject({ label: "Y", value: 3, y0: 30, y1: 60 });
  });

  it("omits a link entirely for a zero-count cell", () => {
    const layout = computeAlluvialLayout(
      { sourceLabels: ["A", "B"], targetLabels: ["X", "Y"], counts: [[3, 1], [0, 2]] },
      60,
      0,
    );
    expect(layout.links).toHaveLength(3);
    expect(layout.links.some((l) => l.sourceIndex === 1 && l.targetIndex === 0)).toBe(false);
  });

  it("partitions each node's own span exactly across its links - no gaps, no overlaps", () => {
    const layout = computeAlluvialLayout(
      {
        sourceLabels: ["A", "B", "C"],
        targetLabels: ["X", "Y"],
        counts: [
          [2, 5],
          [4, 0],
          [1, 1],
        ],
      },
      130,
      0,
    );
    for (const node of layout.sourceNodes) {
      const spans = layout.links
        .filter((l) => layout.sourceNodes[l.sourceIndex] === node)
        .map((l) => l.sourceY1 - l.sourceY0);
      const total = spans.reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(node.y1 - node.y0, 6);
    }
    for (const node of layout.targetNodes) {
      const spans = layout.links
        .filter((l) => layout.targetNodes[l.targetIndex] === node)
        .map((l) => l.targetY1 - l.targetY0);
      const total = spans.reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(node.y1 - node.y0, 6);
    }
  });

  it("gives a zero-total node zero height and doesn't reserve a gap for it", () => {
    const layout = computeAlluvialLayout(
      { sourceLabels: ["A", "Empty", "B"], targetLabels: ["X"], counts: [[5], [0], [5]] },
      100,
      10,
    );
    expect(layout.sourceNodes[1]).toMatchObject({ value: 0, y0: layout.sourceNodes[1].y1 });
    // Only one real gap needed (between A and B) - Empty contributes none.
    expect(layout.sourceNodes[2].y0 - layout.sourceNodes[0].y1).toBeCloseTo(10, 6);
  });

  it("leaves a gap between every pair of adjacent nonzero-total nodes", () => {
    const layout = computeAlluvialLayout(
      { sourceLabels: ["A", "B", "C"], targetLabels: ["X"], counts: [[1], [1], [1]] },
      90,
      6,
    );
    expect(layout.sourceNodes[1].y0 - layout.sourceNodes[0].y1).toBeCloseTo(6, 6);
    expect(layout.sourceNodes[2].y0 - layout.sourceNodes[1].y1).toBeCloseTo(6, 6);
    // Each node gets an equal share of the remaining (90 - 2*6) = 78px budget.
    expect(layout.sourceNodes[0].y1 - layout.sourceNodes[0].y0).toBeCloseTo(26, 6);
  });

  it("returns an empty layout for an all-zero input without dividing by zero", () => {
    const layout = computeAlluvialLayout(
      { sourceLabels: ["A"], targetLabels: ["X"], counts: [[0]] },
      100,
      4,
    );
    expect(layout.sourceNodes[0].y0).toBe(0);
    expect(layout.sourceNodes[0].y1).toBe(0);
    expect(layout.links).toHaveLength(0);
  });

  it("preserves source and target label order for node lookup by index", () => {
    const layout = computeAlluvialLayout(
      { sourceLabels: ["Hymn", "Lament"], targetLabels: ["Cluster 1", "Cluster 2"], counts: [[1, 2], [3, 0]] },
      50,
      2,
    );
    expect(layout.sourceNodes.map((n) => n.label)).toEqual(["Hymn", "Lament"]);
    expect(layout.targetNodes.map((n) => n.label)).toEqual(["Cluster 1", "Cluster 2"]);
  });
});
