import { describe, expect, it } from "vitest";
import type { SimilarityPayload } from "../types";
import { topMatches } from "./ranking";

function makePayload(): SimilarityPayload {
  return {
    meta: {
      method: "lexical-tfidf-cosine",
      description: "",
      corpus: { name: "ETCBC/BHSA", version: "2021" },
      generatedAt: "2026-01-01T00:00:00Z",
      psalmCount: 3,
    },
    psalmNumbers: [1, 2, 3],
    psalms: [],
    similar: {
      "1": [
        { psalm: 2, score: 0.8, sharedLexemes: [] },
        { psalm: 3, score: 0.1, sharedLexemes: [] },
      ],
      "2": [],
    },
    matrix: [
      [1, 0.8, 0.1],
      [0.8, 1, 0.05],
      [0.1, 0.05, 1],
    ],
  };
}

describe("topMatches", () => {
  it("returns the precomputed ranked list for a psalm", () => {
    const result = topMatches(makePayload(), 1);
    expect(result.map((e) => e.psalm)).toEqual([2, 3]);
  });

  it("respects the limit parameter", () => {
    const result = topMatches(makePayload(), 1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].psalm).toBe(2);
  });

  it("returns an empty array for a psalm with no similar entries", () => {
    expect(topMatches(makePayload(), 2)).toEqual([]);
  });

  it("returns an empty array for an unknown psalm number", () => {
    expect(topMatches(makePayload(), 999)).toEqual([]);
  });

  it("does not mutate the underlying payload", () => {
    const payload = makePayload();
    const original = payload.similar["1"];
    topMatches(payload, 1, 1);
    expect(payload.similar["1"]).toHaveLength(original.length);
  });
});
