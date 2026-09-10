import { describe, expect, it } from "vitest";
import { DIVERGING_COLORSCALE, GENRE_COLORS, PARALLELISM_TYPE_COLORS, TOKENS } from "./tokens";

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
