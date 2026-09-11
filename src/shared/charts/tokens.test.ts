import { describe, expect, it } from "vitest";
import {
  DIVERGING_COLORSCALE,
  GENRE_COLORS,
  HEATMAP_STEPS,
  PARALLELISM_TYPE_COLORS,
  steppedColorFn,
  steppedColorscale,
  TOKENS,
} from "./tokens";

describe("steppedColorscale", () => {
  it("spans the whole domain, so no value falls outside the ramp", () => {
    const stops = steppedColorscale(["#a", "#b"]);
    expect(stops[0]?.[0]).toBe(0);
    expect(stops.at(-1)?.[0]).toBe(1);
  });

  it("gives each color a band of equal width", () => {
    expect(steppedColorscale(["#a", "#b", "#c", "#d"]).map(([at]) => at)).toEqual([
      0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1,
    ]);
  });

  it("repeats a color across its band, so Plotly steps rather than interpolates", () => {
    expect(steppedColorscale(["#a", "#b"]).map(([, color]) => color)).toEqual([
      "#a",
      "#a",
      "#b",
      "#b",
    ]);
  });

  it("refuses an empty list, there being no ramp to make", () => {
    expect(() => steppedColorscale([])).toThrow(RangeError);
  });
});

describe("steppedColorFn", () => {
  const color = steppedColorFn(["#a", "#b", "#c", "#d"], 1);

  it("puts a value in the band its share of the domain falls in", () => {
    expect([color(0.1), color(0.3), color(0.6), color(0.9)]).toEqual(["#a", "#b", "#c", "#d"]);
  });

  it("starts a band at its own stop, the way the ramp does", () => {
    expect(color(0.25)).toBe("#b");
    expect(color(0.75)).toBe("#d");
  });

  it("clamps at both ends rather than falling off the ramp", () => {
    expect(color(-5)).toBe("#a");
    expect(color(5)).toBe("#d");
  });

  it("keeps the top of the domain in the last band rather than past it", () => {
    expect(color(1)).toBe("#d");
  });

  it("refuses a domain or a list it cannot make a ramp from", () => {
    expect(() => steppedColorFn([], 1)).toThrow(RangeError);
    expect(() => steppedColorFn(["#a"], 0)).toThrow(RangeError);
  });
});

describe("DIVERGING_COLORSCALE", () => {
  const bands = Array.from({ length: DIVERGING_COLORSCALE.length / 2 }, (_, i) =>
    DIVERGING_COLORSCALE.slice(i * 2, i * 2 + 2),
  );

  it("holds four bands", () => {
    expect(bands).toHaveLength(4);
    expect(new Set(DIVERGING_COLORSCALE.map(([, color]) => color)).size).toBe(4);
  });

  it("repeats each color across its band, so Plotly steps rather than interpolates", () => {
    for (const [low, high] of bands) {
      expect(high?.[1]).toBe(low?.[1]);
      expect(high?.[0]).toBeGreaterThan(low?.[0] ?? 1);
    }
  });

  it("hands adjacent bands a shared edge, so no value falls between them", () => {
    expect(DIVERGING_COLORSCALE.map(([position]) => position)).toEqual([
      0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1,
    ]);
  });

  it("ends on the two hues the site already reads as negative and positive", () => {
    expect(DIVERGING_COLORSCALE[0]?.[1]).toBe(TOKENS.heatmapNeg);
    expect(DIVERGING_COLORSCALE.at(-1)?.[1]).toBe(TOKENS.heatmapPos);
  });

  it("is the shared four bands, so every matrix on the site reads alike", () => {
    expect(DIVERGING_COLORSCALE).toEqual(steppedColorscale(HEATMAP_STEPS));
  });
});

describe("categorical palettes", () => {
  it("gives each parallelism type a hue the genre palette already carries", () => {
    const genreHues = new Set(Object.values(GENRE_COLORS));
    for (const hue of Object.values(PARALLELISM_TYPE_COLORS)) expect(genreHues).toContain(hue);
  });

  it("gives every genre a distinct hue", () => {
    const hues = Object.values(GENRE_COLORS);
    expect(new Set(hues).size).toBe(hues.length);
  });
});
