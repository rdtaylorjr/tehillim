import { describe, expect, it } from "vitest";
import { INITIAL_SELECTION } from "./selection";
import type { Selection } from "./selection";
import { pathSentence, selectionPath } from "./path";

const at = (over: Partial<Selection>): Selection => ({ ...INITIAL_SELECTION, ...over });

describe("selectionPath", () => {
  it("heads the path with the two crossed trees", () => {
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
    const path = selectionPath(at({ family: "morphology", text: "vocalized" }));
    expect(path.map((crumb) => crumb.label)).toEqual(["Morphology", "Parallelism"]);
  });

  it("carries the parallelism type when the parallelism benchmark is chosen", () => {
    const path = selectionPath(at({ benchmark: "parallelism", parallelismType: "Synonymous" }));
    expect(path.at(-1)).toEqual({ kind: "minor", label: "Synonymous" });
  });

  it("carries the genre when the genre benchmark is chosen", () => {
    const path = selectionPath(at({ benchmark: "genre", genre: "Wisdom" }));
    expect(path.at(-1)).toEqual({ kind: "minor", label: "Wisdom" });
  });

  it("never shows the metric, which its own dropdown already states", () => {
    const path = selectionPath(
      at({ benchmark: "genre", metric: "turning_angle_distance", genre: "Wisdom" }),
    );
    expect(path.map((crumb) => crumb.label)).not.toContain("Turning Angle Distance");
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
