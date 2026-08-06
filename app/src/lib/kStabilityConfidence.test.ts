import { describe, expect, it } from "vitest";
import { describeKStability } from "./kStabilityConfidence";

describe("describeKStability", () => {
  it("returns null when stability is null (not a data-driven k choice)", () => {
    expect(describeKStability(2, null)).toBeNull();
  });

  it("reads as low when the k choice is close to a coin flip across resamples", () => {
    const result = describeKStability(2, 0.03);
    expect(result?.level).toBe("low");
    expect(result?.message).toContain("k=2");
    expect(result?.message).toContain("3%");
  });

  it("reads as moderate for a mid-range stability", () => {
    const result = describeKStability(4, 0.5);
    expect(result?.level).toBe("moderate");
    expect(result?.message).toContain("50%");
  });

  it("reads as high when the k choice agrees on almost every resample", () => {
    const result = describeKStability(10, 0.97);
    expect(result?.level).toBe("high");
    expect(result?.message).toContain("97%");
  });

  it("treats the low-stability threshold as exclusive on the low side", () => {
    const result = describeKStability(2, 0.4);
    expect(result?.level).toBe("moderate");
  });

  it("treats the high-stability threshold as exclusive on the low side", () => {
    const result = describeKStability(2, 0.7);
    expect(result?.level).toBe("high");
  });
});
