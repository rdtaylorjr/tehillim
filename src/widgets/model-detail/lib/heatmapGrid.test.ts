import { describe, expect, it } from "vitest";
import {
  buildHeatmapGrid,
  crossFadeShapes,
  genreIndexRanges,
  genreTickAnchors,
  robustAbsClip,
} from "./heatmapGrid";
import type { PsalmOrderEntry } from "../model/types";

const order: PsalmOrderEntry[] = [
  { psalm: 1, genre: "Hymn" },
  { psalm: 2, genre: "Hymn" },
  { psalm: 3, genre: "Lament" },
];

describe("genreTickAnchors", () => {
  it("places one tick at the midpoint index of each contiguous genre run", () => {
    expect(genreTickAnchors(order)).toEqual([
      { index: 0, genre: "Hymn" },
      { index: 2, genre: "Lament" },
    ]);
  });

  it("rounds down for an even-length run", () => {
    const fourHymns: PsalmOrderEntry[] = [
      { psalm: 1, genre: "Hymn" },
      { psalm: 2, genre: "Hymn" },
      { psalm: 3, genre: "Hymn" },
      { psalm: 4, genre: "Hymn" },
    ];
    expect(genreTickAnchors(fourHymns)).toEqual([{ index: 1, genre: "Hymn" }]);
  });
});

describe("genreIndexRanges", () => {
  it("maps each genre to its contiguous [start, end) index range", () => {
    const ranges = genreIndexRanges(order);
    expect(ranges.get("Hymn")).toEqual({ start: 0, end: 2 });
    expect(ranges.get("Lament")).toEqual({ start: 2, end: 3 });
  });
});

describe("robustAbsClip", () => {
  it("returns the 90th percentile of absolute values", () => {
    const values = Array.from({ length: 10 }, (_, i) => i + 1);
    expect(robustAbsClip(values)).toBe(10);
  });

  it("clips negative and positive values by magnitude alike", () => {
    expect(robustAbsClip([-5, -1, 2, 3])).toBe(robustAbsClip([5, 1, 2, 3]));
  });

  it("falls back to a tiny epsilon for an empty array so a zero-width color scale never occurs", () => {
    expect(robustAbsClip([])).toBeGreaterThan(0);
  });
});

describe("buildHeatmapGrid", () => {
  // Psalm 3 (index 2) has no cell at all, mirroring Psalm 117's real zero-pairs case.
  const grid = buildHeatmapGrid(
    [{ psalm_a: 1, psalm_b: 2, value: 0.5 }],
    order,
    "calibrated_z",
  );

  it("fills the diagonal with z=0 and a Psalm-N hover label, never a true gap", () => {
    expect(grid.z[0]![0]).toBe(0);
    expect(grid.text[0]![0]).toBe("Psalm 1");
  });

  it("mirrors each pair's value symmetrically across the diagonal", () => {
    expect(grid.z[0]![1]).toBe(0.5);
    expect(grid.z[1]![0]).toBe(0.5);
  });

  it("writes a psalm-pair hover label with the value for a real pair", () => {
    expect(grid.text[0]![1]).toBe("Psalm 1 vs 2<br>calibrated_z: 0.500");
  });

  it("marks a psalm with zero pairs anywhere as z=0 with an explicit no-data hover label", () => {
    expect(grid.z[2]![0]).toBe(0);
    expect(grid.text[2]![0]).toBe("Psalm 3 vs 1<br>no data");
    expect(grid.text[2]![1]).toBe("Psalm 3 vs 2<br>no data");
  });

  it("computes the 90th-percentile absolute clip from the real cell values", () => {
    expect(grid.clipAbs).toBe(robustAbsClip([0.5]));
  });

  it("silently skips a cell referencing a psalm absent from the axis order, rather than throwing", () => {
    const withBadCell = buildHeatmapGrid(
      [
        { psalm_a: 1, psalm_b: 2, value: 0.5 },
        { psalm_a: 1, psalm_b: 999, value: 0.9 },
      ],
      order,
      "calibrated_z",
    );
    expect(withBadCell.z[0]![1]).toBe(0.5);
  });
});

describe("crossFadeShapes", () => {
  it("produces four wash rectangles outside the row/col band, and no cell border by default", () => {
    const shapes = crossFadeShapes(5, 1, 3, 1, 3, 1, 1, false, "#fff", "#000");
    expect(shapes).toHaveLength(4);
  });

  it("adds a fifth, fill-less bordered rect on exactly the hovered cell when includeCellBorder is set", () => {
    const shapes = crossFadeShapes(5, 1, 3, 1, 3, 2, 2, true, "#fff", "#000");
    expect(shapes).toHaveLength(5);
    const border = shapes[4]!;
    expect(border.fillcolor).toBe("rgba(0,0,0,0)");
    expect(border.x0).toBe(1.5);
    expect(border.x1).toBe(2.5);
    expect(border.y0).toBe(1.5);
    expect(border.y1).toBe(2.5);
    expect(border.line.color).toBe("#000");
  });

  it("uses the given wash color and opacity for the four band-fade rects", () => {
    const shapes = crossFadeShapes(5, 1, 3, 1, 3, 1, 1, false, "#abcabc", "#000");
    expect(shapes.every((s) => s.fillcolor === "#abcabc")).toBe(true);
  });
});
