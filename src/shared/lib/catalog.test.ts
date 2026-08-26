import { describe, expect, it } from "vitest";
import {
  facetOf,
  BENCHMARKS,
  GENRES,
  MODEL_FAMILIES,
  PARALLELISM_TYPES,
  TEXT_VARIANTS,
  TRAJECTORY_METRICS,
  facetFor,
  familyFor,
  sentenceCase,
} from "./catalog";

describe("MODEL_FAMILIES", () => {
  it("lists the six families in linguistic-hierarchy order, semantic first", () => {
    expect(MODEL_FAMILIES.map((f) => f.id)).toEqual([
      "semantic",
      "lexical",
      "phonology",
      "morphology",
      "syntax",
      "discourse",
    ]);
  });

  it("marks phonology and discourse as carrying no benchmark data", () => {
    expect(MODEL_FAMILIES.filter((f) => !f.hasData).map((f) => f.id)).toEqual([
      "phonology",
      "discourse",
    ]);
  });
});

describe("facetFor", () => {
  it("gives lexical a Unit facet of homograph, lexeme, and word", () => {
    expect(facetFor("lexical")).toEqual({
      label: "Unit",
      values: ["homograph", "lexeme", "word"],
    });
  });

  it("gives syntax a Level facet of clause and phrase", () => {
    expect(facetFor("syntax")).toEqual({ label: "Level", values: ["clause", "phrase"] });
  });

  it("gives every other family no facet", () => {
    expect(facetFor("semantic")).toBeUndefined();
    expect(facetFor("phonology")).toBeUndefined();
    expect(facetFor("morphology")).toBeUndefined();
    expect(facetFor("discourse")).toBeUndefined();
  });
});

describe("familyFor", () => {
  it("finds a family by id", () => {
    expect(familyFor("syntax").label).toBe("Syntax");
  });
});

describe("fixed option lists", () => {
  it("orders parallelism types by the canonical scholarly sequence, not alphabetically", () => {
    expect(PARALLELISM_TYPES).toEqual([
      "Synonymous",
      "Antithetic",
      "Synthetic",
      "Emblematic",
      "Staircase",
    ]);
  });

  it("offers the four trajectory metrics alongside genre discrimination", () => {
    expect(TRAJECTORY_METRICS).toEqual([
      "content_distance",
      "structural_distance",
      "step_magnitude_distance",
      "turning_angle_distance",
    ]);
  });

  it("lists the seven genres and the three text variants", () => {
    expect(GENRES).toHaveLength(7);
    expect(TEXT_VARIANTS).toEqual(["consonantal", "vocalized", "cantillation"]);
  });

  it("names both benchmarks", () => {
    expect(BENCHMARKS.map((b) => b.id)).toEqual(["parallelism", "genre"]);
  });
});

describe("sentenceCase", () => {
  it("turns a snake_case value into a capitalized label", () => {
    expect(sentenceCase("content_distance")).toBe("Content distance");
  });

  it("capitalizes a single word unchanged otherwise", () => {
    expect(sentenceCase("homograph")).toBe("Homograph");
  });
});

describe("facetOf", () => {
  const units = ["homograph", "lexeme", "word"];

  it("matches a model named exactly for its facet", () => {
    expect(facetOf("word", units)).toBe("word");
  });

  it("matches a model prefixed with its facet", () => {
    expect(facetOf("lexeme_tfidf", units)).toBe("lexeme");
  });

  it("does not match a name that merely starts with the same letters", () => {
    expect(facetOf("wordnet", units)).toBeNull();
  });

  it("returns null for a model in no facet", () => {
    expect(facetOf("bge_m3", units)).toBeNull();
  });
});
