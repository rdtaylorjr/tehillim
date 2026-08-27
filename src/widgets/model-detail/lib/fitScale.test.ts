import { describe, expect, it } from "vitest";
import { fitScale } from "./fitScale";

describe("fitScale", () => {
  it("leaves a chart alone when it already fits", () => {
    expect(fitScale(1020, 1200)).toBe(1);
  });

  it("shrinks a chart to the width available", () => {
    expect(fitScale(1000, 500)).toBe(0.5);
  });

  it("never enlarges a chart beyond its authored size", () => {
    expect(fitScale(500, 2000)).toBe(1);
  });

  it("treats an unmeasured container as no constraint, rather than collapsing the chart", () => {
    expect(fitScale(1020, 0)).toBe(1);
  });

  it("ignores a chart whose natural width is not yet known", () => {
    expect(fitScale(0, 600)).toBe(1);
  });
});
