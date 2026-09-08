import { describe, expect, it } from "vitest";
import { detailDataPath } from "./dataPath";

/** The suite's build stamps this, so the assertions read the same constant the code does. */
const V = `?v=${__DETAIL_VERSION__}`;

describe("detailDataPath", () => {
  it("asks for one section, since the detail view renders exactly one", () => {
    expect(detailDataPath("lexical", "word_consonantal_icf_position_mean", "parallelism")).toBe(
      `/data/detail_lexical_word_consonantal_icf_position_mean_parallelism.json${V}`,
    );
  });

  it("names the section it was given", () => {
    expect(detailDataPath("semantic", "berel", "genre")).toBe(
      `/data/detail_semantic_berel_genre.json${V}`,
    );
    expect(detailDataPath("semantic", "berel", "trajectory")).toBe(
      `/data/detail_semantic_berel_trajectory.json${V}`,
    );
  });

  it("uses the given domain and model verbatim, no normalization", () => {
    expect(detailDataPath("semantic", "berel_psalm", "parallelism")).toBe(
      `/data/detail_semantic_berel_psalm_parallelism.json${V}`,
    );
  });

  it("carries the export's version, so a regenerated payload is a new URL to every cache", () => {
    const path = detailDataPath("semantic", "berel", "genre");

    expect(path).toContain("?v=");
    expect(path.split("?v=")[1]).toBeTruthy();
  });

  it("keys R2 on the path alone, so the version never changes the object name", () => {
    /** The Worker slices the pathname; a query would break the lookup if it were in the name. */
    const [name] = detailDataPath("semantic", "berel", "genre").split("?");

    expect(name).toBe("/data/detail_semantic_berel_genre.json");
  });
});
