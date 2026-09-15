import { describe, expect, it } from "vitest";
import { identityOfClusterMethod } from "./methodIdentity";
import type { ClusterMethodPayload } from "../../../shared/model";

const method = (id: string): ClusterMethodPayload =>
  ({ id, description: `${id} prose` }) as ClusterMethodPayload;

describe("identityOfClusterMethod", () => {
  it("reads a corpus method's family off the naming table", () => {
    const identity = identityOfClusterMethod(method("clause-type-spectral"));
    expect(identity).toMatchObject({
      domain: "syntactic",
      representation: "clause-type",
      modelBase: "clause-type",
      aggregation: "tfidf",
    });
    expect(identity.description).toBe("clause-type-spectral prose");
  });

  it("takes a semantic id apart into encoder, text, aggregation, and correction", () => {
    expect(
      identityOfClusterMethod(method("bge-m3-soft-alignment-vocalized-spectral")),
    ).toMatchObject({
      domain: "semantic",
      representation: "bge-m3_vocalized",
      modelBase: "bge-m3",
      textVariant: "vocalized",
      aggregation: "soft-alignment",
      correction: null,
    });
    expect(
      identityOfClusterMethod(method("alephbert-soft-alignment-top-pc-spectral")),
    ).toMatchObject({
      modelBase: "alephbert",
      textVariant: "cantillation",
      correction: "top-pc",
    });
  });

  it("keeps an encoder the naming table has not caught up with under its own id", () => {
    expect(identityOfClusterMethod(method("f2llm-v2-14b-mean-pool-spectral"))).toMatchObject({
      domain: "semantic",
      modelBase: "f2llm-v2-14b",
      representation: "f2llm-v2-14b_cantillation",
    });
  });

  it("files an unrecognised id as a lexical corpus method rather than dropping it", () => {
    expect(identityOfClusterMethod(method("mystery-spectral"))).toMatchObject({
      domain: "lexical",
      representation: "mystery",
      modelBase: "mystery",
    });
  });
});
