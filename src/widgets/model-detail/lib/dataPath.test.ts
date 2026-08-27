import { describe, expect, it } from "vitest";
import { detailDataPath } from "./dataPath";

describe("detailDataPath", () => {
  it("asks for one section, since the detail view renders exactly one", () => {
    expect(detailDataPath("lexical", "word_consonantal_icf_position_mean", "parallelism")).toBe(
      "/data/detail_lexical_word_consonantal_icf_position_mean_parallelism.json",
    );
  });

  it("names the section it was given", () => {
    expect(detailDataPath("semantic", "berel", "genre")).toBe(
      "/data/detail_semantic_berel_genre.json",
    );
    expect(detailDataPath("semantic", "berel", "trajectory")).toBe(
      "/data/detail_semantic_berel_trajectory.json",
    );
  });

  it("uses the given domain and model verbatim, no normalization", () => {
    expect(detailDataPath("semantic", "berel_psalm", "parallelism")).toBe(
      "/data/detail_semantic_berel_psalm_parallelism.json",
    );
  });
});
