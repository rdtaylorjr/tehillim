import { describe, expect, it, vi } from "vitest";
import { ClusterStore, initialClusterState, reduceCluster } from "./clusterStore";

describe("reduceCluster", () => {
  it("selects a psalm", () => {
    const next = reduceCluster(initialClusterState, { type: "SELECT_PSALM", psalm: 23 });
    expect(next.selectedPsalm).toBe(23);
  });

  it("clears the selected psalm with null", () => {
    const selected = reduceCluster(initialClusterState, { type: "SELECT_PSALM", psalm: 23 });
    const cleared = reduceCluster(selected, { type: "SELECT_PSALM", psalm: null });
    expect(cleared.selectedPsalm).toBeNull();
  });

  it("switches the selected cluster method", () => {
    const next = reduceCluster(initialClusterState, {
      type: "SET_CLUSTER_METHOD",
      methodId: "verb-morphology-spectral",
    });
    expect(next.selectedClusterMethodId).toBe("verb-morphology-spectral");
  });

  it("switches the reference color mode", () => {
    const next = reduceCluster(initialClusterState, { type: "SET_REFERENCE_COLOR_MODE", mode: "family" });
    expect(next.referenceColorMode).toBe("family");
  });

  it("switches the cluster view tab", () => {
    const next = reduceCluster(initialClusterState, { type: "SET_CLUSTER_VIEW", view: "scatter" });
    expect(next.clusterView).toBe("scatter");
  });

  it("does not mutate the input state", () => {
    const before = { ...initialClusterState };
    reduceCluster(initialClusterState, { type: "SELECT_PSALM", psalm: 5 });
    expect(initialClusterState).toEqual(before);
  });
});

describe("ClusterStore", () => {
  it("starts with the given initial state", () => {
    const store = new ClusterStore({ ...initialClusterState, selectedPsalm: 7 });
    expect(store.getState().selectedPsalm).toBe(7);
  });

  it("notifies subscribers on dispatch with the new state", () => {
    const store = new ClusterStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.dispatch({ type: "SELECT_PSALM", psalm: 42 });
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ selectedPsalm: 42 }));
  });

  it("stops notifying after unsubscribe", () => {
    const store = new ClusterStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.dispatch({ type: "SELECT_PSALM", psalm: 42 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple independent subscribers", () => {
    const store = new ClusterStore();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    store.subscribe(b);
    store.dispatch({ type: "SET_CLUSTER_METHOD", methodId: "person-profile-spectral" });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
