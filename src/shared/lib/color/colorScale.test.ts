import { hsl } from "d3-color";
import { interpolateRgb } from "d3-interpolate";
import { describe, expect, it } from "vitest";
import {
  createAlignmentColorScale,
  createBookColorScale,
  createGunkelFamilyColorScale,
  createGunkelGenreColorScale,
} from "./colorScale";

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

describe("createGunkelGenreColorScale", () => {
  const families = ["Hymn", "Lament"];
  const genres = ["Hymn", "Enthronement Psalm", "Song of Zion", "Individual Lament"];
  const genreFamily = new Map([
    ["Hymn", "Hymn"],
    ["Enthronement Psalm", "Hymn"],
    ["Song of Zion", "Hymn"],
    ["Individual Lament", "Lament"],
  ]);

  it("gives every genre in a family that family's own hex, no shading", () => {
    const familyScale = createGunkelFamilyColorScale(families);
    const genreScale = createGunkelGenreColorScale(genres, families, genreFamily);
    for (const genre of ["Hymn", "Enthronement Psalm", "Song of Zion"]) {
      expect(genreScale(genre)).toBe(familyScale("Hymn"));
    }
    expect(genreScale("Individual Lament")).toBe(familyScale("Lament"));
  });

  it("falls back to a neutral gray for a genre with no mapped family", () => {
    const scale = createGunkelGenreColorScale(["Orphan Genre"], families, new Map());
    expect(scale("Orphan Genre")).toBe("#6b6f76");
  });
});

describe("createAlignmentColorScale", () => {
  it("maps 0 to the panel's own inset ground, so an empty cell disappears into it", () => {
    const scale = createAlignmentColorScale();
    expect(scale(0)).toBe(interpolateRgb("#23272c", "#7ba3d9")(0));
  });

  it("maps 1 to the accent end of the interpolator", () => {
    const scale = createAlignmentColorScale();
    expect(scale(1)).toBe(interpolateRgb("#23272c", "#7ba3d9")(1));
  });

  it("is stable across repeated calls for the same share", () => {
    const scale = createAlignmentColorScale();
    expect(scale(0.4)).toBe(scale(0.4));
  });
});

describe("the dark-ground palette", () => {
  it("keeps every book hue light enough to read against the panel", () => {
    //: Every categorical hue has to sit clearly above the panel's lightness.
    const scale = createBookColorScale();
    for (const book of [1, 2, 3, 4, 5]) {
      expect(hsl(scale(book)).l).toBeGreaterThan(0.4);
    }
  });

  it("keeps every family hue light enough to read against the panel", () => {
    const families = ["Hymn", "Lament", "Royal Psalm", "Thanksgiving", "Wisdom", "Minor"];
    const scale = createGunkelFamilyColorScale(families);
    for (const family of families) {
      expect(hsl(scale(family)).l).toBeGreaterThan(0.4);
    }
  });
});
