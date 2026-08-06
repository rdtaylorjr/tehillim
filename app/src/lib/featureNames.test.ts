import { describe, expect, it } from "vitest";
import { baseFeatureId, featureNameFromMethodId, similarityIdForClusterMethodId } from "./featureNames";

describe("baseFeatureId", () => {
  it("strips the Compare-page similarity suffix", () => {
    expect(baseFeatureId("verb-morphology-tfidf-cosine")).toBe("verb-morphology");
  });

  it("strips the Cluster-page spectral suffix", () => {
    expect(baseFeatureId("verb-morphology-spectral")).toBe("verb-morphology");
  });
});

describe("featureNameFromMethodId", () => {
  it("returns the same name for a signal's Compare and Cluster ids", () => {
    expect(featureNameFromMethodId("person-profile-tfidf-cosine")).toBe(
      featureNameFromMethodId("person-profile-spectral"),
    );
    expect(featureNameFromMethodId("person-profile-tfidf-cosine")).toBe(
      "Syntactic Similarity (Person)",
    );
  });

  it("falls back to the raw id for an unknown method", () => {
    expect(featureNameFromMethodId("mystery-method")).toBe("mystery-method");
  });
});

describe("similarityIdForClusterMethodId", () => {
  it("maps a cluster method id to its Compare-page similarity id", () => {
    expect(similarityIdForClusterMethodId("clause-type-spectral")).toBe(
      "clause-type-tfidf-cosine",
    );
  });
});
