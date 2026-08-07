import { describe, expect, it } from "vitest";
import { isThematicClustering } from "./clusterFamily";

describe("isThematicClustering", () => {
  it("flags every lexical/thematic signal", () => {
    for (const id of [
      "lexical-spectral",
      "root-spectral",
      "named-entity-identity-spectral",
      "lexical-set-spectral",
      "named-entity-spectral",
    ]) {
      expect(isThematicClustering(id)).toBe(true);
    }
  });

  it("does not flag any syntactic/genre-track signal", () => {
    for (const id of [
      "verb-morphology-spectral",
      "person-profile-spectral",
      "clause-type-spectral",
      "text-type-spectral",
      "clause-relation-spectral",
      "verb-sense-spectral",
    ]) {
      expect(isThematicClustering(id)).toBe(false);
    }
  });

  it("flags AlephBERT's semantic variants (strong AMI, theme/genre ambiguity unresolved)", () => {
    expect(isThematicClustering("alephbert-mean-pool-spectral")).toBe(true);
    expect(isThematicClustering("alephbert-soft-alignment-spectral")).toBe(true);
  });

  it("does not flag MiqraBERT's semantic variants (no structure found, nothing to mis-attribute)", () => {
    expect(isThematicClustering("miqrabert-mean-pool-spectral")).toBe(false);
    expect(isThematicClustering("miqrabert-soft-alignment-spectral")).toBe(false);
  });
});
