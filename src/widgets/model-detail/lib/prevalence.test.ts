import { describe, expect, it } from "vitest";
import { computePrevalence } from "./prevalence";

describe("computePrevalence", () => {
  it("computes the positive-class fraction from positive and negative counts", () => {
    expect(computePrevalence(10, 90)).toBeCloseTo(0.1, 10);
  });

  it("returns 0 when there are no positives", () => {
    expect(computePrevalence(0, 50)).toBe(0);
  });

  it("returns 0 rather than dividing by zero when both counts are zero", () => {
    expect(computePrevalence(0, 0)).toBe(0);
  });
});
