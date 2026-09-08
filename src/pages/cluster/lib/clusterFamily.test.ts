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

  it("does not flag NeoDictaBERT's mean-pool variant (collapses to k=1 like MiqraBERT, nothing to mis-attribute)", () => {
    expect(isThematicClustering("neodictabert-mean-pool-spectral")).toBe(false);
  });

  it("flags AlephBERT's anisotropy-correction variants (same content/genre ambiguity as raw AlephBERT; mean-pool has no corrected counterpart, see clusterFamily.ts)", () => {
    expect(isThematicClustering("alephbert-soft-alignment-top-pc-spectral")).toBe(true);
    expect(isThematicClustering("alephbert-soft-alignment-whitened-spectral")).toBe(true);
  });

  it("flags NeoDictaBERT's soft-alignment variant and BEREL's semantic variants (same content/genre ambiguity as any embedding-based encoder)", () => {
    expect(isThematicClustering("neodictabert-soft-alignment-spectral")).toBe(true);
    expect(isThematicClustering("berel-mean-pool-spectral")).toBe(true);
    expect(isThematicClustering("berel-soft-alignment-spectral")).toBe(true);
  });

  it("flags BEREL's and NeoDictaBERT's anisotropy-correction variants (same content/genre ambiguity as AlephBERT's; both found real k>1 structure, nothing like MiqraBERT's/NeoDictaBERT-mean-pool's k=1 to exclude)", () => {
    expect(isThematicClustering("berel-soft-alignment-top-pc-spectral")).toBe(true);
    expect(isThematicClustering("berel-soft-alignment-whitened-spectral")).toBe(true);
    expect(isThematicClustering("neodictabert-soft-alignment-top-pc-spectral")).toBe(true);
    expect(isThematicClustering("neodictabert-soft-alignment-whitened-spectral")).toBe(true);
  });

  it("flags all four bge-multilingual-gemma2 signals (same content/genre ambiguity as every other embedding-based signal)", () => {
    expect(isThematicClustering("bge-multilingual-gemma2-mean-pool-spectral")).toBe(true);
    expect(isThematicClustering("bge-multilingual-gemma2-mean-pool-unvocalized-spectral")).toBe(
      true,
    );
    expect(isThematicClustering("bge-multilingual-gemma2-soft-alignment-spectral")).toBe(true);
    expect(
      isThematicClustering("bge-multilingual-gemma2-soft-alignment-unvocalized-spectral"),
    ).toBe(true);
  });

  it("flags all four Qwen3-Embedding-8B signals (same content/genre ambiguity as every other embedding-based signal)", () => {
    expect(isThematicClustering("qwen3-embedding-mean-pool-spectral")).toBe(true);
    expect(isThematicClustering("qwen3-embedding-mean-pool-unvocalized-spectral")).toBe(true);
    expect(isThematicClustering("qwen3-embedding-soft-alignment-spectral")).toBe(true);
    expect(isThematicClustering("qwen3-embedding-soft-alignment-unvocalized-spectral")).toBe(
      true,
    );
  });

  it("flags all four KaLM-Embedding-Gemma3-12B signals (same content/genre ambiguity as every other embedding-based signal)", () => {
    expect(isThematicClustering("kalm-embedding-mean-pool-spectral")).toBe(true);
    expect(isThematicClustering("kalm-embedding-mean-pool-unvocalized-spectral")).toBe(true);
    expect(isThematicClustering("kalm-embedding-soft-alignment-spectral")).toBe(true);
    expect(isThematicClustering("kalm-embedding-soft-alignment-unvocalized-spectral")).toBe(
      true,
    );
  });

  it("flags all four Gemini Embedding 2 signals (same content/genre ambiguity as every other embedding-based signal)", () => {
    expect(isThematicClustering("gemini-mean-pool-spectral")).toBe(true);
    expect(isThematicClustering("gemini-mean-pool-unvocalized-spectral")).toBe(true);
    expect(isThematicClustering("gemini-soft-alignment-spectral")).toBe(true);
    expect(isThematicClustering("gemini-soft-alignment-unvocalized-spectral")).toBe(true);
  });
});
