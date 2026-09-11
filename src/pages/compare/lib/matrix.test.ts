import { describe, expect, it } from "vitest";
import { boundaryShapes, hoverTextGrid, valueGrid } from "./matrix";

describe("hoverTextGrid", () => {
  const psalms = [1, 2, 3];
  const matrix = [
    [1, 0.5, 0.25],
    [0.5, 1, 0.75],
    [0.25, 0.75, 1],
  ];

  it("names the psalm alone on the diagonal, where a pair would repeat itself", () => {
    expect(hoverTextGrid(psalms, matrix)[0]?.[0]).toBe("Psalm 1");
  });

  it("names both psalms and the score off the diagonal", () => {
    expect(hoverTextGrid(psalms, matrix)[1]?.[2]).toBe("Psalm 2 & Psalm 3<br>0.750 similarity");
  });

  it("names the cell's own row first, the score being the symmetric part", () => {
    const grid = hoverTextGrid(psalms, matrix);
    expect(grid[2]?.[1]).toBe("Psalm 3 & Psalm 2<br>0.750 similarity");
    expect(grid[1]?.[2]).toContain("0.750 similarity");
  });

  it("leaves a cell the matrix does not cover empty rather than guessing", () => {
    expect(hoverTextGrid(psalms, [[1]])[2]?.[2]).toBe("Psalm 3");
    expect(hoverTextGrid(psalms, [[1]])[0]?.[1]).toBe("");
  });
});

describe("valueGrid", () => {
  const matrix = [
    [1, 0.5, 0.25],
    [0.5, 1, 0.75],
    [0.25, 0.75, 1],
  ];

  it("empties the diagonal, self-similarity being a fixed 1 rather than a reading", () => {
    const grid = valueGrid(matrix);
    expect([grid[0]?.[0], grid[1]?.[1], grid[2]?.[2]]).toEqual([null, null, null]);
  });

  it("carries every off-diagonal value through unchanged", () => {
    expect(valueGrid(matrix)[1]).toEqual([0.5, null, 0.75]);
  });

  it("leaves the matrix it was handed alone", () => {
    valueGrid(matrix);
    expect(matrix[0]?.[0]).toBe(1);
  });
});

describe("boundaryShapes", () => {
  it("draws one vertical and one horizontal rule per boundary", () => {
    const shapes = boundaryShapes([41], 150, "#fff");
    expect(shapes).toHaveLength(2);
    expect(shapes.map((s) => s.type)).toEqual(["line", "line"]);
  });

  it("puts a rule between the last cell of one book and the first of the next", () => {
    const [vertical] = boundaryShapes([41], 150, "#fff");
    expect(vertical?.x0).toBe(40.5);
    expect(vertical?.x1).toBe(40.5);
  });

  it("draws nothing when no boundary is given", () => {
    expect(boundaryShapes([], 150, "#fff")).toEqual([]);
  });
});
