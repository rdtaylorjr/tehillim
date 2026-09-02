import { describe, expect, it } from "vitest";
import {
  baseFeatureId,
  featureNameFromMethodId,
  similarityIdForClusterMethodId,
} from "./featureNames";

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
    expect(featureNameFromMethodId("person-profile-tfidf-cosine")).toBe("Syntactic (Person)");
  });

  it("falls back to the raw id for an unknown method", () => {
    expect(featureNameFromMethodId("mystery-method")).toBe("mystery-method");
  });

  it("labels the four Cluster-page-only semantic-embedding signals", () => {
    expect(featureNameFromMethodId("alephbert-mean-pool-spectral")).toBe(
      "Semantic (AlephBERT, Mean-Pool)",
    );
    expect(featureNameFromMethodId("alephbert-soft-alignment-spectral")).toBe(
      "Semantic (AlephBERT, Soft-Alignment)",
    );
    expect(featureNameFromMethodId("miqrabert-mean-pool-spectral")).toBe(
      "Semantic (MiqraBERT, Mean-Pool)",
    );
    expect(featureNameFromMethodId("miqrabert-soft-alignment-spectral")).toBe(
      "Semantic (MiqraBERT, Soft-Alignment)",
    );
  });

  it("labels the two AlephBERT anisotropy-correction ablation signals (soft-alignment only - mean-pool's corrected variants are structurally incompatible with spectral clustering, see semantic_embedding.py)", () => {
    expect(featureNameFromMethodId("alephbert-soft-alignment-top-pc-spectral")).toBe(
      "Semantic (AlephBERT, Soft-Alignment, Top-PC Removed)",
    );
    expect(featureNameFromMethodId("alephbert-soft-alignment-whitened-spectral")).toBe(
      "Semantic (AlephBERT, Soft-Alignment, Whitened)",
    );
  });

  it("labels the four NeoDictaBERT/BEREL semantic-embedding signals", () => {
    expect(featureNameFromMethodId("neodictabert-mean-pool-spectral")).toBe(
      "Semantic (NeoDictaBERT, Mean-Pool)",
    );
    expect(featureNameFromMethodId("neodictabert-soft-alignment-spectral")).toBe(
      "Semantic (NeoDictaBERT, Soft-Alignment)",
    );
    expect(featureNameFromMethodId("berel-mean-pool-spectral")).toBe(
      "Semantic (BEREL, Mean-Pool)",
    );
    expect(featureNameFromMethodId("berel-soft-alignment-spectral")).toBe(
      "Semantic (BEREL, Soft-Alignment)",
    );
  });

  it("labels the four BEREL/NeoDictaBERT anisotropy-correction ablation signals (soft-alignment only, same structural reason as AlephBERT's)", () => {
    expect(featureNameFromMethodId("berel-soft-alignment-top-pc-spectral")).toBe(
      "Semantic (BEREL, Soft-Alignment, Top-PC Removed)",
    );
    expect(featureNameFromMethodId("berel-soft-alignment-whitened-spectral")).toBe(
      "Semantic (BEREL, Soft-Alignment, Whitened)",
    );
    expect(featureNameFromMethodId("neodictabert-soft-alignment-top-pc-spectral")).toBe(
      "Semantic (NeoDictaBERT, Soft-Alignment, Top-PC Removed)",
    );
    expect(featureNameFromMethodId("neodictabert-soft-alignment-whitened-spectral")).toBe(
      "Semantic (NeoDictaBERT, Soft-Alignment, Whitened)",
    );
  });

  it("labels all three text variants (consonantal/vocalized/cantillation) for every multilingual encoder that ships them", () => {
    const models: [string, string][] = [
      ["bge-multilingual-gemma2", "BGE-Multilingual-Gemma2"],
      ["qwen3-embedding", "Qwen3-Embedding"],
      ["kalm-embedding", "KaLM-Embedding"],
      ["llama-embed-nemotron", "Llama-Embed-Nemotron-8B"],
      ["gemini", "Gemini"],
      ["openai", "OpenAI"],
      ["cohere", "Cohere"],
      ["voyage", "Voyage 4"],
      ["bge-m3", "BGE-M3"],
      ["gte-multilingual-base", "GTE-Multilingual-Base"],
      ["me5-large-instruct", "mE5-Large-Instruct"],
    ];
    for (const [slug, label] of models) {
      for (const agg of ["mean-pool", "soft-alignment"] as const) {
        const aggLabel = agg === "mean-pool" ? "Mean-Pool" : "Soft-Alignment";
        expect(featureNameFromMethodId(`${slug}-${agg}-spectral`)).toBe(
          `Semantic (${label}, ${aggLabel}, Cantillation)`,
        );
        expect(featureNameFromMethodId(`${slug}-${agg}-consonantal-spectral`)).toBe(
          `Semantic (${label}, ${aggLabel}, Consonantal)`,
        );
        expect(featureNameFromMethodId(`${slug}-${agg}-vocalized-spectral`)).toBe(
          `Semantic (${label}, ${aggLabel}, Vocalized)`,
        );
      }
    }
  });
});

describe("similarityIdForClusterMethodId", () => {
  it("maps a cluster method id to its Compare-page similarity id", () => {
    expect(similarityIdForClusterMethodId("clause-type-spectral")).toBe(
      "clause-type-tfidf-cosine",
    );
  });
});
