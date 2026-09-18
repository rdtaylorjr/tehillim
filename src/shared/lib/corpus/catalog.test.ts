import { describe, expect, it } from "vitest";
import {
  facetOf,
  BENCHMARKS,
  MODEL_FAMILIES,
  PARALLELISM_TYPES,
  SOURCES,
  TEXT_VARIANTS,
  facetFor,
  familyFor,
  sentenceCase,
  sourceFor,
  unitLabel,
} from "./catalog";

describe("MODEL_FAMILIES", () => {
  it("lists the levels of description in their conventional order", () => {
    // Sound, word form, the words themselves, how they combine, what they mean.
    expect(MODEL_FAMILIES.map((f) => f.id)).toEqual([
      "phonological",
      "morphological",
      "lexical",
      "syntactic",
      "semantic",
    ]);
  });

  it("marks phonological as carrying no benchmark data", () => {
    expect(MODEL_FAMILIES.filter((f) => !f.hasData).map((f) => f.id)).toEqual(["phonological"]);
  });
});

describe("facetFor", () => {
  it("gives lexical a Type facet of homograph, lexeme, and word", () => {
    expect(facetFor("lexical")).toEqual({
      label: "Type",
      values: ["homograph", "lexeme", "word"],
    });
  });

  it("gives syntactic a Level facet of phrase then clause, the smaller unit first", () => {
    expect(facetFor("syntactic")).toEqual({ label: "Level", values: ["phrase", "clause"] });
  });

  it("gives every other family no facet", () => {
    expect(facetFor("semantic")).toBeUndefined();
    expect(facetFor("phonological")).toBeUndefined();
    expect(facetFor("morphological")).toBeUndefined();
  });
});

describe("familyFor", () => {
  it("finds a family by id", () => {
    expect(familyFor("syntactic").label).toBe("Syntactic");
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

  it("lists the three text variants", () => {
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
  const types = ["homograph", "lexeme", "word"];

  it("matches a model named exactly for its facet", () => {
    expect(facetOf("word", types)).toBe("word");
  });

  it("matches a model prefixed with its facet", () => {
    expect(facetOf("lexeme_tfidf", types)).toBe("lexeme");
  });

  it("does not match a name that merely starts with the same letters", () => {
    expect(facetOf("wordnet", types)).toBeNull();
  });

  it("returns null for a model in no facet", () => {
    expect(facetOf("bge_m3", types)).toBeNull();
  });
});

describe("sources", () => {
  it("offers Gunkel first, the primary source, then Logos", () => {
    expect(SOURCES.map((s) => s.id)).toEqual(["gunkel", "logos"]);
  });

  it("names each source and the word it uses for a class", () => {
    expect(sourceFor("logos")).toEqual({ id: "logos", label: "Logos", category: "Genre" });
    expect(sourceFor("gunkel").category).toBe("Gattung");
  });

  it("reads a unit register as the list of units it counts, in Gunkel's words", () => {
    expect(unitLabel("song")).toBe("Lied");
    expect(unitLabel("song_component")).toBe("Lied, Stück");
    expect(unitLabel("song_component_motif")).toBe("Lied, Stück, Motiv");
  });
});
