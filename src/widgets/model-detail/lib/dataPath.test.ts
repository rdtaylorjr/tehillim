import { describe, expect, it } from "vitest";
import { detailDataPath } from "./dataPath";

describe("detailDataPath", () => {
  it("builds the stopgap sample-data fetch path from domain and model", () => {
    expect(detailDataPath("lexical", "word_consonantal_icf_position_mean")).toBe(
      "./sample-data/detail_lexical_word_consonantal_icf_position_mean.json",
    );
  });

  it("uses the given domain and model verbatim, no normalization", () => {
    expect(detailDataPath("semantic", "berel_psalm")).toBe(
      "./sample-data/detail_semantic_berel_psalm.json",
    );
  });
});
