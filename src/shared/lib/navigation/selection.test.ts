import { describe, expect, it } from "vitest";
import { INITIAL_SELECTION, selectionReducer, showsFacet, showsText } from "./selection";
import type { Selection } from "./selection";

function reduce(
  from: Selection,
  ...actions: Parameters<typeof selectionReducer>[1][]
): Selection {
  return actions.reduce(selectionReducer, from);
}

describe("showsFacet", () => {
  it("offers the extra selector to families that are divided into units or levels", () => {
    expect(showsFacet("lexical")).toBe(true);
    expect(showsFacet("syntax")).toBe(true);
  });

  it("withholds it from a family with no such division", () => {
    expect(showsFacet("semantic")).toBe(false);
  });
});

describe("showsText", () => {
  it("offers text variants throughout the semantic family", () => {
    expect(showsText("semantic", "all")).toBe(true);
    expect(showsText("semantic", "word")).toBe(true);
  });

  it("offers them to lexical's word models alone", () => {
    expect(showsText("lexical", "word")).toBe(true);
    expect(showsText("lexical", "all")).toBe(false);
    expect(showsText("lexical", "root")).toBe(false);
  });

  it("withholds them from a family that carries none", () => {
    expect(showsText("syntax", "word")).toBe(false);
    expect(showsText("morphology", "all")).toBe(false);
  });
});

describe("selectionReducer on family", () => {
  it("drops everything that belonged to the outgoing family", () => {
    //: Facet, text, query and model all belong to the family being left.
    const dirty = reduce(
      INITIAL_SELECTION,
      { type: "family/selected", family: "lexical" },
      { type: "facet/selected", facet: "word" },
      { type: "text/selected", text: "vocalized" },
      { type: "query/changed", query: "bge" },
      { type: "model/selected", model: "bge_m3_vocalized" },
    );
    const moved = selectionReducer(dirty, { type: "family/selected", family: "syntax" });
    expect(moved).toMatchObject({
      family: "syntax",
      facet: "all",
      text: "all",
      query: "",
      model: null,
    });
  });

  it("keeps the benchmark, which is chosen independently of the family", () => {
    const onGenre = selectionReducer(INITIAL_SELECTION, {
      type: "benchmark/selected",
      benchmark: "genre",
    });
    expect(
      selectionReducer(onGenre, { type: "family/selected", family: "lexical" }).benchmark,
    ).toBe("genre");
  });
});

describe("selectionReducer on facet", () => {
  it("clears a text variant the incoming facet cannot carry", () => {
    //: Only word models carry text variants, so moving off word drops it.
    const worded = reduce(
      INITIAL_SELECTION,
      { type: "family/selected", family: "lexical" },
      { type: "facet/selected", facet: "word" },
      { type: "text/selected", text: "vocalized" },
    );
    expect(worded.text).toBe("vocalized");
    expect(selectionReducer(worded, { type: "facet/selected", facet: "root" }).text).toBe(
      "all",
    );
  });

  it("keeps one the incoming facet still carries", () => {
    const semantic = reduce(INITIAL_SELECTION, { type: "text/selected", text: "vocalized" });
    expect(selectionReducer(semantic, { type: "facet/selected", facet: "word" }).text).toBe(
      "vocalized",
    );
  });
});

describe("selectionReducer identity", () => {
  it("returns the same object when any action would not change anything", () => {
    const unchanged: Parameters<typeof selectionReducer>[1][] = [
      { type: "family/selected", family: "semantic" },
      { type: "benchmark/selected", benchmark: "parallelism" },
      { type: "parallelismType/selected", parallelismType: "all" },
      { type: "genre/selected", genre: "all" },
      { type: "metric/selected", metric: "genre" },
      { type: "facet/selected", facet: "all" },
      { type: "text/selected", text: "all" },
      { type: "query/changed", query: "" },
      { type: "model/selected", model: null },
    ];
    for (const action of unchanged) {
      expect(selectionReducer(INITIAL_SELECTION, action)).toBe(INITIAL_SELECTION);
    }
  });

  it("applies each remaining action when the value does differ", () => {
    expect(
      selectionReducer(INITIAL_SELECTION, { type: "benchmark/selected", benchmark: "genre" })
        .benchmark,
    ).toBe("genre");
    expect(
      selectionReducer(INITIAL_SELECTION, { type: "genre/selected", genre: "Trust" }).genre,
    ).toBe("Trust");
    expect(
      selectionReducer(INITIAL_SELECTION, { type: "text/selected", text: "vocalized" }).text,
    ).toBe("vocalized");
    expect(
      selectionReducer(INITIAL_SELECTION, { type: "query/changed", query: "bge" }).query,
    ).toBe("bge");
  });
});
