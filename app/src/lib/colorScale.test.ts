import { interpolateTurbo } from "d3-scale-chromatic";
import { describe, expect, it } from "vitest";
import { createBookColorScale, createSimilarityColorScale } from "./colorScale";

describe("createSimilarityColorScale", () => {
  it("maps 0 to the start of the Turbo interpolator", () => {
    const scale = createSimilarityColorScale(1);
    expect(scale(0)).toBe(interpolateTurbo(0));
  });

  it("maps the domain maximum to the end of the Turbo interpolator", () => {
    const scale = createSimilarityColorScale(0.9);
    expect(scale(0.9)).toBe(interpolateTurbo(1));
  });

  it("maps the domain midpoint to the middle of the interpolator", () => {
    const scale = createSimilarityColorScale(1);
    expect(scale(0.5)).toBe(interpolateTurbo(0.5));
  });

  it("throws for a non-positive maximum", () => {
    expect(() => createSimilarityColorScale(0)).toThrow(RangeError);
  });
});

describe("createBookColorScale", () => {
  it("assigns a distinct color to each of the five books", () => {
    const scale = createBookColorScale();
    const colors = new Set([1, 2, 3, 4, 5].map((b) => scale(b)));
    expect(colors.size).toBe(5);
  });

  it("returns valid CSS hex colors", () => {
    const scale = createBookColorScale();
    for (const book of [1, 2, 3, 4, 5]) {
      expect(scale(book)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("is stable across repeated calls for the same book", () => {
    const scale = createBookColorScale();
    expect(scale(3)).toBe(scale(3));
  });
});
