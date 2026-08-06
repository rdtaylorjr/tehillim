import { describe, expect, it } from "vitest";
import { describeScatterConfidence } from "./scatterConfidence";

describe("describeScatterConfidence", () => {
  it("reads as good when structure-captured is high and the partition is real", () => {
    const result = describeScatterConfidence(0.72, 0.22, 0.27);
    expect(result.level).toBe("good");
    expect(result.message).toContain("72%");
  });

  it("reads as moderate when structure-captured is low but the partition is real", () => {
    const result = describeScatterConfidence(0.29, 0.22, 0.27);
    expect(result.level).toBe("moderate");
    expect(result.message).toContain("29%");
  });

  it("reads as low when the partition is statistically indistinguishable from random", () => {
    const result = describeScatterConfidence(0.44, 0.02, -0.004);
    expect(result.level).toBe("low");
    expect(result.message).toContain("0.02");
    expect(result.message).toContain("-0.00");
  });

  it("reads as low when both structure-captured and the partition are weak", () => {
    const result = describeScatterConfidence(0.09, -0.005, 0.038);
    expect(result.level).toBe("low");
    expect(result.message).toContain("9%");
  });

  it("treats the structure-captured threshold as exclusive on the low side", () => {
    // Exactly at the boundary should read as good/real, not low - "below
    // 40%" means strictly below, not "at or below".
    const result = describeScatterConfidence(0.4, 0.3, 0.3);
    expect(result.level).toBe("good");
  });

  it("treats the AMI/ARI near-zero threshold as exclusive on the low side", () => {
    const result = describeScatterConfidence(0.6, 0.05, 0.05);
    expect(result.level).toBe("good");
  });
});
