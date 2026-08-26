import { describe, expect, it } from "vitest";
import { formatPValue, formatQValue } from "./format";

describe("formatPValue", () => {
  it("matches validate_against_genre.py's CLI printer, 4 decimal places", () => {
    expect(formatPValue(0.0314159)).toBe("0.0314");
  });

  it("shows the smallest attainable permutation p-value at full precision", () => {
    expect(formatPValue(1 / 10001)).toBe("0.0001");
  });

  it("renders an unavailable value as an em dash, never the string NaN", () => {
    expect(formatPValue(NaN)).toBe("—");
  });
});

describe("formatQValue", () => {
  it("matches validate_against_genre.py's CLI printer, 4 decimal places", () => {
    expect(formatQValue(0.0567)).toBe("0.0567");
  });

  it("renders an unavailable value as an em dash, never the string NaN", () => {
    expect(formatQValue(NaN)).toBe("—");
  });
});
