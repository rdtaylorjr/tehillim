import { describe, expect, it } from "vitest";
import { applyFacetFilter, applyNameFilter, applyTextFilter } from "./rowFilters";

describe("applyFacetFilter", () => {
  const rows = [
    { model: "phrase_typ_1gram", model_base: "phrase_typ_1gram" },
    { model: "clause_typ_1gram", model_base: "clause_typ_1gram" },
    { model: "bge_m3", model_base: "bge_m3" },
  ];

  it("returns every row unfiltered when unit is all", () => {
    expect(applyFacetFilter(rows, "syntax", "all")).toEqual(rows);
  });

  it("keeps only rows matching the chosen facet value for a faceted domain", () => {
    expect(applyFacetFilter(rows, "syntax", "phrase")).toEqual([rows[0]]);
  });

  it("returns every row unfiltered for a domain with no facet at all", () => {
    expect(applyFacetFilter(rows, "semantic", "phrase")).toEqual(rows);
  });

  it("falls back to model when a row carries no model_base", () => {
    const noBase = [{ model: "phrase_typ_1gram" }];
    expect(applyFacetFilter(noBase, "syntax", "phrase")).toEqual(noBase);
  });
});

describe("applyTextFilter", () => {
  const rows = [{ text_variant: "vocalized" }, { text_variant: "consonantal" }];

  it("returns every row when text is all", () => {
    expect(applyTextFilter(rows, "all")).toEqual(rows);
  });

  it("keeps only rows matching the chosen text variant", () => {
    expect(applyTextFilter(rows, "vocalized")).toEqual([rows[0]]);
  });
});

describe("applyNameFilter", () => {
  const rows = [{ model: "BGE_M3_Vocalized" }, { model: "homograph_binary" }];

  it("returns every row when the filter is empty", () => {
    expect(applyNameFilter(rows, "")).toEqual(rows);
  });

  it("matches case-insensitively against the model name", () => {
    expect(applyNameFilter(rows, "bge")).toEqual([rows[0]]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(applyNameFilter(rows, "nonexistent")).toEqual([]);
  });

  it("treats a row with no model field as an empty name, never matching a non-empty filter", () => {
    expect(applyNameFilter([{}], "bge")).toEqual([]);
  });
});
