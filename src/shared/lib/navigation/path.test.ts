import { describe, expect, it } from "vitest";
import { INITIAL_SELECTION } from "./selection";
import type { Selection } from "./selection";
import { headCrumbs, pathSentence, selectionPath } from "./path";

const at = (over: Partial<Selection>): Selection => ({ ...INITIAL_SELECTION, ...over });

describe("selectionPath", () => {
  it("heads the path with the two crossed trees", () => {
    //: The page name leads the toolbar, so the path is the selection alone.
    expect(selectionPath(INITIAL_SELECTION)).toEqual([
      { kind: "major", label: "Semantic" },
      { kind: "major", label: "Parallelism" },
    ]);
  });

  it("omits every filter still at its default, so a wide selection stays short", () => {
    const path = selectionPath(at({ family: "lexical", facet: "all", text: "all" }));
    expect(path.filter((crumb) => crumb.kind === "minor")).toEqual([]);
  });

  it("adds the family's own division and text variant, in that order", () => {
    const path = selectionPath(at({ family: "lexical", facet: "word", text: "consonantal" }));
    expect(path).toEqual([
      { kind: "major", label: "Lexical" },
      { kind: "major", label: "Parallelism" },
      { kind: "minor", label: "Word" },
      { kind: "minor", label: "Consonantal" },
    ]);
  });

  it("drops the text variant for a family that has none, even when one is set", () => {
    const path = selectionPath(at({ family: "morphological", text: "vocalized" }));
    expect(path.map((crumb) => crumb.label)).toEqual(["Morphological", "Parallelism"]);
  });

  it("carries the parallelism type when the parallelism benchmark is chosen", () => {
    const path = selectionPath(at({ benchmark: "parallelism", parallelismType: "Synonymous" }));
    expect(path.at(-1)).toEqual({ kind: "minor", label: "Synonymous" });
  });

  it("names the source, then its unit register, then the class, under the genre benchmark", () => {
    const path = selectionPath(at({ benchmark: "genre", source: "logos", genre: "Wisdom" }));
    expect(path.filter((c) => c.kind === "minor")).toEqual([
      { kind: "minor", label: "Logos" },
      { kind: "minor", label: "Wisdom" },
    ]);
    const gunkel = selectionPath(
      at({ benchmark: "genre", source: "gunkel", unit: "song_component", genre: "Hymnus" }),
    );
    expect(gunkel.filter((c) => c.kind === "minor").map((c) => c.label)).toEqual([
      "Gunkel",
      "Lied, Stück",
      "Hymnus",
    ]);
  });

  it("always names the source under the genre benchmark, since neither is a default", () => {
    expect(selectionPath(at({ benchmark: "genre" })).filter((c) => c.kind === "minor")).toEqual(
      [{ kind: "minor", label: "Gunkel" }],
    );
  });

  it("ends with the open model, marked apart from the filters before it", () => {
    const path = selectionPath(at({ family: "lexical", facet: "word", model: "model_03" }));
    expect(path.at(-1)).toEqual({ kind: "model", label: "model_03" });
  });
});

describe("pathSentence", () => {
  it("joins the two crossed trees with the operator that relates them", () => {
    expect(pathSentence(INITIAL_SELECTION)).toBe("Semantic \u00d7 Parallelism");
  });

  it("names the filters when any are set", () => {
    expect(pathSentence(at({ family: "lexical", facet: "word", text: "consonantal" }))).toBe(
      "Lexical \u00d7 Parallelism, filtered to Word, Consonantal",
    );
  });

  it("leaves the open model out, since a caption describes the table not the row", () => {
    expect(pathSentence(at({ model: "bge_m3" }))).toBe("Semantic \u00d7 Parallelism");
  });
});

describe("headCrumbs", () => {
  it("qualifies the page name with the two crossed trees while no model is open", () => {
    expect(headCrumbs(at({ family: "lexical", facet: "word" }))).toEqual([
      { kind: "major", label: "Lexical" },
      { kind: "major", label: "Parallelism" },
    ]);
  });

  it("names only the open model, since the toolbar below states the rest", () => {
    expect(headCrumbs(at({ family: "lexical", facet: "word", model: "bge_m3" }))).toEqual([
      { kind: "model", label: "bge_m3" },
    ]);
  });
});
