import { describe, expect, it } from "vitest";
import { maxOffDiagonal } from "./matrix";

describe("maxOffDiagonal", () => {
  it("ignores the diagonal even when it holds the largest values", () => {
    const matrix = [
      [1, 0.2, 0.1],
      [0.2, 1, 0.05],
      [0.1, 0.05, 1],
    ];
    expect(maxOffDiagonal(matrix)).toBe(0.2);
  });

  it("finds the maximum anywhere off the diagonal", () => {
    const matrix = [
      [1, 0.1, 0.9],
      [0.1, 1, 0.3],
      [0.9, 0.3, 1],
    ];
    expect(maxOffDiagonal(matrix)).toBe(0.9);
  });

  it("returns 0 for a 1x1 matrix (no off-diagonal cells)", () => {
    expect(maxOffDiagonal([[1]])).toBe(0);
  });

  it("returns 0 for an empty matrix", () => {
    expect(maxOffDiagonal([])).toBe(0);
  });
});
