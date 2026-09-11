import { describe, expect, it } from "vitest";
import { diagonalGrid, diagonalTrace } from "./matrixDiagonal";

describe("diagonalGrid", () => {
  it("marks every cell where a psalm meets itself", () => {
    const grid = diagonalGrid(3);
    expect([grid[0]?.[0], grid[1]?.[1], grid[2]?.[2]]).toEqual([1, 1, 1]);
  });

  it("leaves every other cell empty, so the values below show through", () => {
    const grid = diagonalGrid(3);
    expect(grid[0]?.[1]).toBeNull();
    expect(grid[2]?.[0]).toBeNull();
  });

  it("is square, matching the matrix it covers", () => {
    const grid = diagonalGrid(4);
    expect(grid).toHaveLength(4);
    expect(grid.every((row) => row.length === 4)).toBe(true);
  });

  it("holds nothing for an empty matrix", () => {
    expect(diagonalGrid(0)).toEqual([]);
  });
});

describe("diagonalTrace", () => {
  const trace = diagonalTrace(3, "#6b6f76") as unknown as Record<string, unknown>;

  it("paints one flat color rather than reading the value scale", () => {
    expect(trace["colorscale"]).toEqual([
      [0, "#6b6f76"],
      [1, "#6b6f76"],
    ]);
  });

  it("keeps its own bar and hover out of the way of the matrix beneath", () => {
    expect(trace["showscale"]).toBe(false);
    expect(trace["hoverinfo"]).toBe("skip");
  });
});
