import { describe, expect, it } from "vitest";
import type { ClusterMethodPayload, GenreAlignment, GunkelPayload } from "../types";
import {
  alignmentFor,
  computeShare,
  isDarkCell,
  isSelectedCell,
  selectedAlignmentCell,
} from "./alignmentCell";

describe("computeShare", () => {
  it("divides count by total", () => {
    expect(computeShare(3, 12)).toBe(0.25);
  });

  it("is 0 for a total of 0 rather than NaN", () => {
    expect(computeShare(0, 0)).toBe(0);
  });
});

describe("isDarkCell", () => {
  it("is false at and below the threshold", () => {
    expect(isDarkCell(0.55)).toBe(false);
    expect(isDarkCell(0.3)).toBe(false);
  });

  it("is true above the threshold", () => {
    expect(isDarkCell(0.56)).toBe(true);
  });
});

describe("isSelectedCell", () => {
  it("matches when both the category and cluster agree", () => {
    expect(isSelectedCell("Hymn", 2, { category: "Hymn", cluster: 2 })).toBe(true);
  });

  it("does not match a different category in the same cluster", () => {
    expect(isSelectedCell("Lament", 2, { category: "Hymn", cluster: 2 })).toBe(false);
  });

  it("does not match the same category in a different cluster", () => {
    expect(isSelectedCell("Hymn", 3, { category: "Hymn", cluster: 2 })).toBe(false);
  });

  it("matches nothing when there is no selection", () => {
    expect(isSelectedCell("Hymn", 2, null)).toBe(false);
  });
});

const EMPTY_ALIGNMENT: GenreAlignment = {
  genres: [],
  counts: [],
  genreTotals: [],
  clusterGenreLabels: [],
  purity: 0,
  ami: 0,
  ari: 0,
  amiPValue: 1,
  amiPValueAdjusted: 1,
};

function makeMethod(overrides: Partial<ClusterMethodPayload> = {}): ClusterMethodPayload {
  return {
    id: "test-method",
    description: "",
    nClusters: 2,
    partitionPValue: null,
    kStability: null,
    assignments: {},
    clusters: [],
    embedding: { x: [], y: [], structureCaptured: 1 },
    genreAlignment: { ...EMPTY_ALIGNMENT, genres: ["Individual Lament"] },
    familyAlignment: { ...EMPTY_ALIGNMENT, genres: ["Lament"] },
    ...overrides,
  };
}

describe("alignmentFor", () => {
  it("returns the 6-family alignment in family mode", () => {
    const method = makeMethod();
    expect(alignmentFor(method, "family")).toBe(method.familyAlignment);
  });

  it("returns the 14-genre alignment in genre mode", () => {
    const method = makeMethod();
    expect(alignmentFor(method, "genre")).toBe(method.genreAlignment);
  });

  it("falls back to the 14-genre alignment in book mode", () => {
    // Book has no Gunkel granularity of its own.
    const method = makeMethod();
    expect(alignmentFor(method, "book")).toBe(method.genreAlignment);
  });
});

function makeGunkel(overrides: Partial<GunkelPayload> = {}): GunkelPayload {
  return {
    generatedAt: "2026-01-01T00:00:00Z",
    genres: ["Individual Lament"],
    families: ["Lament"],
    psalms: [{ number: 23, genre: "Individual Lament", family: "Lament" }],
    ...overrides,
  };
}

describe("selectedAlignmentCell", () => {
  it("resolves the genre category and cluster for the selected psalm", () => {
    const method = makeMethod({ assignments: { "23": 4 } });
    const cell = selectedAlignmentCell(makeGunkel(), method, "genre", 23);
    expect(cell).toEqual({ category: "Individual Lament", cluster: 4 });
  });

  it("resolves the family category when in family mode", () => {
    const method = makeMethod({ assignments: { "23": 4 } });
    const cell = selectedAlignmentCell(makeGunkel(), method, "family", 23);
    expect(cell).toEqual({ category: "Lament", cluster: 4 });
  });

  it("is null when no psalm is selected", () => {
    const method = makeMethod({ assignments: { "23": 4 } });
    expect(selectedAlignmentCell(makeGunkel(), method, "genre", null)).toBeNull();
  });

  it("is null for a psalm excluded from Gunkel's classification", () => {
    const gunkel = makeGunkel({ psalms: [{ number: 27, genre: null, family: null }] });
    const method = makeMethod({ assignments: { "27": 4 } });
    expect(selectedAlignmentCell(gunkel, method, "genre", 27)).toBeNull();
  });

  it("is null when the psalm has no cluster assignment", () => {
    const method = makeMethod({ assignments: {} });
    expect(selectedAlignmentCell(makeGunkel(), method, "genre", 23)).toBeNull();
  });

  it("is null when the psalm isn't in the Gunkel payload at all", () => {
    const gunkel = makeGunkel({ psalms: [] });
    const method = makeMethod({ assignments: { "23": 4 } });
    expect(selectedAlignmentCell(gunkel, method, "genre", 23)).toBeNull();
  });
});
