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
  it("is true only for the families that have one", () => {
    expect(showsFacet("lexical")).toBe(true);
    expect(showsFacet("syntax")).toBe(true);
    expect(showsFacet("semantic")).toBe(false);
    expect(showsFacet("morphology")).toBe(false);
  });
});

describe("showsText", () => {
  it("is true for semantic at any facet value", () => {
    expect(showsText("semantic", "all")).toBe(true);
  });

  it("for lexical is true only at the word unit", () => {
    expect(showsText("lexical", "word")).toBe(true);
    expect(showsText("lexical", "homograph")).toBe(false);
    expect(showsText("lexical", "lexeme")).toBe(false);
    expect(showsText("lexical", "all")).toBe(false);
  });

  it("is false for the families whose models carry no text variant", () => {
    expect(showsText("phonology", "all")).toBe(false);
    expect(showsText("morphology", "all")).toBe(false);
    expect(showsText("syntax", "clause")).toBe(false);
    expect(showsText("discourse", "all")).toBe(false);
  });
});

describe("selectionReducer", () => {
  it("starts on semantic parallelism with every filter unset", () => {
    expect(INITIAL_SELECTION).toEqual({
      family: "semantic",
      benchmark: "parallelism",
      parallelismType: "all",
      genre: "all",
      metric: "genre",
      facet: "all",
      text: "all",
      query: "",
      collapsed: false,
      model: null,
    });
  });

  it("records the model a row click chose", () => {
    const picked = selectionReducer(INITIAL_SELECTION, {
      type: "model/selected",
      model: "bge_m3_vocalized",
    });
    expect(picked.model).toBe("bge_m3_vocalized");
  });

  it("forgets the selected model when the family changes, since it belongs to the old one", () => {
    const picked = reduce(
      INITIAL_SELECTION,
      { type: "model/selected", model: "bge_m3_vocalized" },
      { type: "family/selected", family: "syntax" },
    );
    expect(picked.model).toBeNull();
  });

  it("clears family-scoped filters when the family changes", () => {
    const narrowed = reduce(
      INITIAL_SELECTION,
      { type: "family/selected", family: "lexical" },
      { type: "facet/selected", facet: "word" },
      { type: "text/selected", text: "vocalized" },
      { type: "query/changed", query: "bge" },
    );
    expect(narrowed.facet).toBe("word");

    const switched = selectionReducer(narrowed, { type: "family/selected", family: "syntax" });
    expect(switched).toMatchObject({ family: "syntax", facet: "all", text: "all", query: "" });
  });

  it("clears text when the facet moves off the value that offered it", () => {
    const atWord = reduce(
      INITIAL_SELECTION,
      { type: "family/selected", family: "lexical" },
      { type: "facet/selected", facet: "word" },
      { type: "text/selected", text: "cantillation" },
    );
    expect(atWord.text).toBe("cantillation");

    const moved = selectionReducer(atWord, { type: "facet/selected", facet: "lexeme" });
    expect(moved.text).toBe("all");
  });

  it("keeps benchmark-scoped filters when the family changes", () => {
    const typed = reduce(INITIAL_SELECTION, {
      type: "parallelismType/selected",
      parallelismType: "Staircase",
    });
    const switched = selectionReducer(typed, { type: "family/selected", family: "morphology" });
    expect(switched.parallelismType).toBe("Staircase");
  });

  it("leaves genre alone when the metric changes, the two being independent scopes", () => {
    const scoped = reduce(
      INITIAL_SELECTION,
      { type: "benchmark/selected", benchmark: "genre" },
      { type: "genre/selected", genre: "Lament" },
    );
    expect(scoped.genre).toBe("Lament");

    const remetered = selectionReducer(scoped, {
      type: "metric/selected",
      metric: "structural_distance",
    });
    // Metric and genre are independent scopes, so choosing one leaves the other alone.
    expect(remetered).toMatchObject({ metric: "structural_distance", genre: "Lament" });
  });

  it("folds the branch rows away without disturbing any filter", () => {
    const folded = selectionReducer(INITIAL_SELECTION, { type: "collapsed/toggled" });
    expect(folded.collapsed).toBe(true);
    expect({ ...folded, collapsed: false }).toEqual(INITIAL_SELECTION);
    expect(selectionReducer(folded, { type: "collapsed/toggled" })).toEqual(INITIAL_SELECTION);
  });

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
