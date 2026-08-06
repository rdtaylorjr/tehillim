import { describe, expect, it } from "vitest";
import { maxOffDiagonal, percentile, percentileOffDiagonal } from "./matrix";

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

describe("percentileOffDiagonal", () => {
  // Off-diagonal values, sorted: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6 (6 pairs from a 4x4 matrix)
  const matrix = [
    [1, 0.1, 0.2, 0.3],
    [0.1, 1, 0.4, 0.5],
    [0.2, 0.4, 1, 0.6],
    [0.3, 0.5, 0.6, 1],
  ];

  it("returns the minimum off-diagonal value at the 0th percentile", () => {
    expect(percentileOffDiagonal(matrix, 0)).toBeCloseTo(0.1);
  });

  it("returns the maximum off-diagonal value at the 100th percentile", () => {
    expect(percentileOffDiagonal(matrix, 100)).toBeCloseTo(0.6);
  });

  it("returns a value near the middle at the 50th percentile", () => {
    const median = percentileOffDiagonal(matrix, 50);
    expect(median).toBeGreaterThanOrEqual(0.3);
    expect(median).toBeLessThanOrEqual(0.4);
  });

  it("returns a higher threshold for a higher percentile", () => {
    expect(percentileOffDiagonal(matrix, 90)).toBeGreaterThan(
      percentileOffDiagonal(matrix, 10),
    );
  });

  it("handles a matrix with a single off-diagonal pair", () => {
    expect(percentileOffDiagonal([[1, 0.7], [0.7, 1]], 98)).toBeCloseTo(0.7);
  });

  it("returns 0 for a matrix with no off-diagonal cells", () => {
    expect(percentileOffDiagonal([[1]], 50)).toBe(0);
  });

  it("returns 0 for an empty matrix", () => {
    expect(percentileOffDiagonal([], 50)).toBe(0);
  });
});

describe("percentile", () => {
  // sorted: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6
  const values = [0.4, 0.1, 0.6, 0.2, 0.5, 0.3];

  it("returns the minimum value at the 0th percentile", () => {
    expect(percentile(values, 0)).toBeCloseTo(0.1);
  });

  it("returns the maximum value at the 100th percentile", () => {
    expect(percentile(values, 100)).toBeCloseTo(0.6);
  });

  it("does not mutate the input array", () => {
    const original = [...values];
    percentile(values, 50);
    expect(values).toEqual(original);
  });

  it("returns a higher value for a higher percentile", () => {
    expect(percentile(values, 90)).toBeGreaterThan(percentile(values, 10));
  });

  it("matches percentileOffDiagonal's own off-diagonal value set", () => {
    // percentileOffDiagonal is the off-diagonal-extraction special case of
    // this general-purpose function - same result for the same values.
    const matrix = [
      [1, 0.1, 0.2],
      [0.1, 1, 0.3],
      [0.2, 0.3, 1],
    ];
    expect(percentile([0.1, 0.2, 0.3], 90)).toBeCloseTo(percentileOffDiagonal(matrix, 90));
  });

  it("returns 0 for an empty array", () => {
    expect(percentile([], 50)).toBe(0);
  });

  it("handles a single-value array", () => {
    expect(percentile([0.42], 37)).toBeCloseTo(0.42);
  });
});
