import { describe, expect, it } from "vitest";
import { formatCorpusCredit } from "./corpusCredit";

describe("formatCorpusCredit", () => {
  it("frames the corpus as what the app is built on, not who built it", () => {
    expect(formatCorpusCredit("BHSA", "2021")).toBe("Built on BHSA 2021 via Text-Fabric");
  });
});
