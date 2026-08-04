import { describe, expect, it } from "vitest";
import type { MethodPayload } from "../types";
import { topMatches } from "./ranking";

function makeMethod(): MethodPayload {
  return {
    id: "lexical-tfidf-cosine",
    description: "",
    psalmNumbers: [1, 2, 3],
    psalmStats: [],
    similar: {
      "1": [
        { psalm: 2, score: 0.8, sharedTerms: [] },
        { psalm: 3, score: 0.1, sharedTerms: [] },
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
    const result = topMatches(makeMethod(), 1);
    expect(result.map((e) => e.psalm)).toEqual([2, 3]);
  });

  it("respects the limit parameter", () => {
    const result = topMatches(makeMethod(), 1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].psalm).toBe(2);
  });

  it("returns an empty array for a psalm with no similar entries", () => {
    expect(topMatches(makeMethod(), 2)).toEqual([]);
  });

  it("returns an empty array for an unknown psalm number", () => {
    expect(topMatches(makeMethod(), 999)).toEqual([]);
  });

  it("does not mutate the underlying payload", () => {
    const method = makeMethod();
    const original = method.similar["1"];
    topMatches(method, 1, 1);
    expect(method.similar["1"]).toHaveLength(original.length);
  });
});
