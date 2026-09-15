import { describe, expect, it } from "vitest";
import { baseFeatureId, featureDisplay } from "./featureNames";

describe("baseFeatureId", () => {
  it("strips the Compare-page similarity suffix", () => {
    expect(baseFeatureId("verb-morphology-tfidf-cosine")).toBe("verb-morphology");
  });

  it("strips the Cluster-page spectral suffix", () => {
    expect(baseFeatureId("verb-morphology-spectral")).toBe("verb-morphology");
  });
});

describe("featureDisplay", () => {
  it("takes a canonical name apart into its family and its detail", () => {
    expect(featureDisplay("person-profile-spectral")).toEqual({
      family: "Syntactic",
      detail: "Person",
      known: true,
    });
  });

  it("reports an id the table lacks as unknown, so the caller names it itself", () => {
    expect(featureDisplay("mystery-spectral")).toEqual({
      family: "",
      detail: null,
      known: false,
    });
  });
});
