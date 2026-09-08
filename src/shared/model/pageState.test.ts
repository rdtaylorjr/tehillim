import { describe, expect, it } from "vitest";
import {
  OPENING_PSALM,
  initialClusterState,
  initialCompareState,
  reduceCluster,
  reduceCompare,
} from "./pageState";
import type { ClusterState, CompareState } from "./pageState";

describe("initialCompareState", () => {
  it("takes its method from the payload rather than a hardcoded guess", () => {
    expect(initialCompareState("verb-morphology-tfidf-cosine").selectedMethodId).toBe(
      "verb-morphology-tfidf-cosine",
    );
  });

  it("opens on a psalm with legible similarity structure", () => {
    expect(initialCompareState("x").selectedPsalm).toBe(OPENING_PSALM);
  });

  it("opens on the matrix, colored by the traditional book division", () => {
    const state = initialCompareState("x");
    expect(state.view).toBe("matrix");
    expect(state.referenceColorMode).toBe("book");
  });
});

describe("reduceCompare", () => {
  const base: CompareState = initialCompareState("lexical-tfidf-cosine");

  it("selects a psalm", () => {
    expect(reduceCompare(base, { type: "SELECT_PSALM", psalm: 42 }).selectedPsalm).toBe(42);
  });

  it("clears the selection when given null", () => {
    expect(reduceCompare(base, { type: "SELECT_PSALM", psalm: null }).selectedPsalm).toBeNull();
  });

  it("switches method", () => {
    const next = reduceCompare(base, { type: "SET_METHOD", methodId: "root-tfidf-cosine" });
    expect(next.selectedMethodId).toBe("root-tfidf-cosine");
  });

  it("switches view", () => {
    expect(reduceCompare(base, { type: "SET_VIEW", view: "network" }).view).toBe("network");
  });

  it("switches reference color mode", () => {
    const next = reduceCompare(base, { type: "SET_REFERENCE_COLOR_MODE", mode: "genre" });
    expect(next.referenceColorMode).toBe("genre");
  });

  it("leaves every other field untouched when one changes", () => {
    const next = reduceCompare(base, { type: "SET_VIEW", view: "network" });
    expect(next.selectedPsalm).toBe(base.selectedPsalm);
    expect(next.selectedMethodId).toBe(base.selectedMethodId);
    expect(next.referenceColorMode).toBe(base.referenceColorMode);
  });

  it("never mutates the state it was given", () => {
    const snapshot = { ...base };
    reduceCompare(base, { type: "SELECT_PSALM", psalm: 99 });
    expect(base).toEqual(snapshot);
  });
});

describe("initialClusterState", () => {
  it("takes its method from the payload rather than a hardcoded guess", () => {
    expect(initialClusterState("lexical-spectral").selectedClusterMethodId).toBe(
      "lexical-spectral",
    );
  });

  it("opens colored by Gunkel family, since genre recovery is the page's point", () => {
    //: This page checks a clustering against the taxonomy, so the picker shows it.
    expect(initialClusterState("x").referenceColorMode).toBe("family");
  });

  it("opens on the alignment view, and on the same psalm Compare does", () => {
    const state = initialClusterState("x");
    expect(state.clusterView).toBe("alignment");
    expect(state.selectedPsalm).toBe(OPENING_PSALM);
  });
});

describe("reduceCluster", () => {
  const base: ClusterState = initialClusterState("lexical-spectral");

  it("selects a psalm", () => {
    expect(reduceCluster(base, { type: "SELECT_PSALM", psalm: 42 }).selectedPsalm).toBe(42);
  });

  it("clears the selection when given null", () => {
    expect(reduceCluster(base, { type: "SELECT_PSALM", psalm: null }).selectedPsalm).toBeNull();
  });

  it("switches cluster method", () => {
    const next = reduceCluster(base, { type: "SET_CLUSTER_METHOD", methodId: "root-spectral" });
    expect(next.selectedClusterMethodId).toBe("root-spectral");
  });

  it("switches view", () => {
    expect(reduceCluster(base, { type: "SET_CLUSTER_VIEW", view: "scatter" }).clusterView).toBe(
      "scatter",
    );
  });

  it("switches reference color mode", () => {
    const next = reduceCluster(base, { type: "SET_REFERENCE_COLOR_MODE", mode: "book" });
    expect(next.referenceColorMode).toBe("book");
  });

  it("leaves every other field untouched when one changes", () => {
    const next = reduceCluster(base, { type: "SET_CLUSTER_VIEW", view: "scatter" });
    expect(next.selectedPsalm).toBe(base.selectedPsalm);
    expect(next.selectedClusterMethodId).toBe(base.selectedClusterMethodId);
    expect(next.referenceColorMode).toBe(base.referenceColorMode);
  });

  it("never mutates the state it was given", () => {
    const snapshot = { ...base };
    reduceCluster(base, { type: "SELECT_PSALM", psalm: 99 });
    expect(base).toEqual(snapshot);
  });
});

describe("the two pages' reducers", () => {
  it("keep their own selections apart", () => {
    //: They overlap on two fields, which is why they stay two small reducers.
    const compare = reduceCompare(initialCompareState("a"), {
      type: "SELECT_PSALM",
      psalm: 7,
    });
    const cluster = initialClusterState("b");
    expect(compare.selectedPsalm).toBe(7);
    expect(cluster.selectedPsalm).toBe(OPENING_PSALM);
  });
});
