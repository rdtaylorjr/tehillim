import { describe, expect, it } from "vitest";
import { createReferenceColoring } from "./referenceColor";
import type { GunkelPayload } from "../types";

const GUNKEL: GunkelPayload = {
  generatedAt: "2026-01-01T00:00:00Z",
  genres: ["Hymn", "Individual Lament"],
  families: ["Hymn", "Lament"],
  psalms: [
    { number: 1, genre: "Hymn", family: "Hymn" },
    { number: 2, genre: "Individual Lament", family: "Lament" },
    { number: 27, genre: null, family: null },
  ],
};

describe("createReferenceColoring - book mode", () => {
  it("colors a psalm by its traditional book", () => {
    const coloring = createReferenceColoring("book", GUNKEL);
    expect(coloring.colorOf(1)).toBe(coloring.colorOf(41)); // both Book I
    expect(coloring.colorOf(1)).not.toBe(coloring.colorOf(42)); // Book I vs II
  });

  it("has a five-entry legend", () => {
    const coloring = createReferenceColoring("book", GUNKEL);
    expect(coloring.legend).toHaveLength(5);
  });
});

describe("createReferenceColoring - family mode", () => {
  it("colors a psalm by its Gunkel family", () => {
    const coloring = createReferenceColoring("family", GUNKEL);
    expect(coloring.colorOf(1)).not.toBe(coloring.colorOf(2));
  });

  it("legend matches the payload's family list", () => {
    const coloring = createReferenceColoring("family", GUNKEL);
    expect(coloring.legend.map((e) => e.label)).toEqual(["Hymn", "Lament"]);
  });

  it("returns a placeholder color for an unclassified psalm", () => {
    const coloring = createReferenceColoring("family", GUNKEL);
    expect(coloring.colorOf(27)).toBe("transparent");
  });
});

describe("createReferenceColoring - genre mode", () => {
  it("colors a psalm by its Gunkel genre", () => {
    const coloring = createReferenceColoring("genre", GUNKEL);
    expect(coloring.colorOf(1)).not.toBe(coloring.colorOf(2));
  });

  it("legend matches the payload's genre list", () => {
    const coloring = createReferenceColoring("genre", GUNKEL);
    expect(coloring.legend.map((e) => e.label)).toEqual(["Hymn", "Individual Lament"]);
  });
});
