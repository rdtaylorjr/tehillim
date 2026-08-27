import { describe, expect, it } from "vitest";
import { formatGapStatHTML, formatScalarStatHTML } from "./statFormat";

describe("formatGapStatHTML", () => {
  it("renders gap, effect size, and a significant p-value in the good class", () => {
    const html = formatGapStatHTML({
      gap: 0.1234,
      p: 0.002,
      effect_size: 0.56,
    });
    expect(html).toContain("0.1234");
    expect(html).toContain("0.56");
    expect(html).toContain('class="pill good"');
    expect(html).toContain("0.002");
  });

  it("renders a non-significant p-value in the warn class with a not-significant note", () => {
    const html = formatGapStatHTML({ gap: 0.01, p: 0.107, effect_size: 0.1 });
    expect(html).toContain('class="pill warn"');
    expect(html).toContain("not significant");
  });

  it("floors a very small p-value at the < 0.001 display, never a misleading 0.0000", () => {
    const html = formatGapStatHTML({ gap: 0.5, p: 0.0001, effect_size: 1.2 });
    expect(html).toContain("&lt; 0.001");
  });
});

describe("formatScalarStatHTML", () => {
  it("renders the point estimate and its 95% CI", () => {
    const html = formatScalarStatHTML("auc", 0.812, 0.77, 0.85);
    expect(html).toContain("0.812");
    expect(html).toContain("[0.770, 0.850]");
    expect(html).toContain("auc");
  });
});
