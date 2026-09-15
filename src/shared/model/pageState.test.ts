import { describe, expect, it } from "vitest";
import {
  INITIAL_CLUSTER_STATE,
  INITIAL_COMPARE_STATE,
  OPENING_PSALM,
  reduceCluster,
  reduceCompare,
} from "./pageState";

describe("INITIAL_COMPARE_STATE", () => {
  it("opens on a psalm with legible similarity structure", () => {
    expect(INITIAL_COMPARE_STATE.selectedPsalm).toBe(OPENING_PSALM);
  });

  it("opens on the matrix, colored by the traditional book division", () => {
    expect(INITIAL_COMPARE_STATE.view).toBe("matrix");
    expect(INITIAL_COMPARE_STATE.referenceColorMode).toBe("book");
  });
});

describe("reduceCompare", () => {
  const base = INITIAL_COMPARE_STATE;

  it("selects a psalm", () => {
    expect(reduceCompare(base, { type: "SELECT_PSALM", psalm: 42 }).selectedPsalm).toBe(42);
  });

  it("clears the selection when given null", () => {
    expect(reduceCompare(base, { type: "SELECT_PSALM", psalm: null }).selectedPsalm).toBeNull();
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
    expect(next.referenceColorMode).toBe(base.referenceColorMode);
  });

  it("never mutates the state it was given", () => {
    const snapshot = { ...base };
    reduceCompare(base, { type: "SELECT_PSALM", psalm: 99 });
    expect(base).toEqual(snapshot);
  });
});

describe("INITIAL_CLUSTER_STATE", () => {
  it("opens colored by Gunkel family, since genre recovery is the page's point", () => {
    //: This page checks a clustering against the taxonomy, so the picker shows it.
    expect(INITIAL_CLUSTER_STATE.referenceColorMode).toBe("family");
  });

  it("opens on the alignment view, and on the same psalm Compare does", () => {
    expect(INITIAL_CLUSTER_STATE.clusterView).toBe("alignment");
    expect(INITIAL_CLUSTER_STATE.selectedPsalm).toBe(OPENING_PSALM);
  });
});

describe("reduceCluster", () => {
  const base = INITIAL_CLUSTER_STATE;

  it("selects a psalm", () => {
    expect(reduceCluster(base, { type: "SELECT_PSALM", psalm: 42 }).selectedPsalm).toBe(42);
  });

  it("clears the selection when given null", () => {
    expect(reduceCluster(base, { type: "SELECT_PSALM", psalm: null }).selectedPsalm).toBeNull();
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
    expect(next.referenceColorMode).toBe(base.referenceColorMode);
  });

  it("never mutates the state it was given", () => {
    const snapshot = { ...base };
    reduceCluster(base, { type: "SELECT_PSALM", psalm: 99 });
    expect(base).toEqual(snapshot);
  });
});
