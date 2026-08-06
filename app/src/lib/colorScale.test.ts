import { hsl } from "d3-color";
import { interpolateTurbo } from "d3-scale-chromatic";
import { interpolateRgb } from "d3-interpolate";
import { describe, expect, it } from "vitest";
import {
  createAlignmentColorScale,
  createBookColorScale,
  createGunkelFamilyColorScale,
  createGunkelGenreColorScale,
  createSimilarityColorScale,
  hueShades,
} from "./colorScale";

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

describe("createGunkelFamilyColorScale", () => {
  it("assigns a distinct color to each family, in the given order", () => {
    const scale = createGunkelFamilyColorScale(["Hymn", "Lament", "Royal Psalm"]);
    const colors = new Set(["Hymn", "Lament", "Royal Psalm"].map(scale));
    expect(colors.size).toBe(3);
  });

  it("returns valid CSS hex colors", () => {
    const scale = createGunkelFamilyColorScale(["Hymn", "Lament"]);
    expect(scale("Hymn")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(scale("Lament")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("is stable across repeated calls for the same family", () => {
    const scale = createGunkelFamilyColorScale(["Hymn"]);
    expect(scale("Hymn")).toBe(scale("Hymn"));
  });
});

describe("hueShades", () => {
  it("returns the base hex unchanged for a single-member group", () => {
    expect(hueShades("#2a78d6", 1)).toEqual(["#2a78d6"]);
  });

  it("returns count evenly-spaced shades, lightest to darkest", () => {
    const shades = hueShades("#2a78d6", 4);
    expect(shades).toHaveLength(4);
    const lightnesses = shades.map((hex) => hsl(hex).l);
    for (let i = 1; i < lightnesses.length; i++) {
      expect(lightnesses[i]).toBeGreaterThan(lightnesses[i - 1]);
    }
  });

  it("holds hue and saturation constant across shades", () => {
    const base = hsl("#2a78d6");
    for (const shade of hueShades("#2a78d6", 3)) {
      const parsed = hsl(shade);
      expect(parsed.h).toBeCloseTo(base.h, 0);
      expect(parsed.s).toBeCloseTo(base.s, 2);
    }
  });

  it("produces distinct shades for every count from 2 to 4", () => {
    for (const count of [2, 3, 4]) {
      const shades = hueShades("#eb6834", count);
      expect(new Set(shades).size).toBe(count);
    }
  });
});

describe("createGunkelGenreColorScale", () => {
  const families = ["Hymn", "Lament"];
  const genres = ["Hymn", "Enthronement Psalm", "Song of Zion", "Individual Lament"];
  const genreFamily = new Map([
    ["Hymn", "Hymn"],
    ["Enthronement Psalm", "Hymn"],
    ["Song of Zion", "Hymn"],
    ["Individual Lament", "Lament"],
  ]);

  it("colors every genre in a family as a shade of that family's own hue", () => {
    const familyScale = createGunkelFamilyColorScale(families);
    const genreScale = createGunkelGenreColorScale(genres, families, genreFamily);
    const hymnHue = hsl(familyScale("Hymn")).h;
    for (const genre of ["Hymn", "Enthronement Psalm", "Song of Zion"]) {
      expect(hsl(genreScale(genre)).h).toBeCloseTo(hymnHue, 0);
    }
  });

  it("gives a family's only genre its family's own hex exactly", () => {
    const familyScale = createGunkelFamilyColorScale(families);
    const genreScale = createGunkelGenreColorScale(genres, families, genreFamily);
    expect(genreScale("Individual Lament")).toBe(familyScale("Lament"));
  });

  it("assigns distinct shades to sibling genres in the same family", () => {
    const genreScale = createGunkelGenreColorScale(genres, families, genreFamily);
    const hymnFamilyColors = new Set(
      ["Hymn", "Enthronement Psalm", "Song of Zion"].map(genreScale),
    );
    expect(hymnFamilyColors.size).toBe(3);
  });

  it("falls back to a neutral gray for a genre with no mapped family", () => {
    const scale = createGunkelGenreColorScale(["Orphan Genre"], families, new Map());
    expect(scale("Orphan Genre")).toBe("#898781");
  });
});

describe("createAlignmentColorScale", () => {
  it("maps 0 to the pale end of the interpolator", () => {
    const scale = createAlignmentColorScale();
    expect(scale(0)).toBe(interpolateRgb("#faf6ef", "#7c4f2a")(0));
  });

  it("maps 1 to the accent end of the interpolator", () => {
    const scale = createAlignmentColorScale();
    expect(scale(1)).toBe(interpolateRgb("#faf6ef", "#7c4f2a")(1));
  });

  it("is stable across repeated calls for the same share", () => {
    const scale = createAlignmentColorScale();
    expect(scale(0.4)).toBe(scale(0.4));
  });
});
