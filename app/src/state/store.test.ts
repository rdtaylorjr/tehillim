import { describe, expect, it, vi } from "vitest";
import { initialState, reduce, Store } from "./store";

describe("reduce", () => {
  it("selects a psalm", () => {
    const next = reduce(initialState, { type: "SELECT_PSALM", psalm: 23 });
    expect(next.selectedPsalm).toBe(23);
  });

  it("clears the selected psalm with null", () => {
    const selected = reduce(initialState, { type: "SELECT_PSALM", psalm: 23 });
    const cleared = reduce(selected, { type: "SELECT_PSALM", psalm: null });
    expect(cleared.selectedPsalm).toBeNull();
  });

  it("switches view mode", () => {
    const next = reduce(initialState, { type: "SET_VIEW", view: "network" });
    expect(next.view).toBe("network");
  });

  it("sets the network threshold", () => {
    const next = reduce(initialState, { type: "SET_THRESHOLD", threshold: 0.6 });
    expect(next.networkThreshold).toBe(0.6);
  });

  it("clamps the threshold to [0, 1] from above", () => {
    const next = reduce(initialState, { type: "SET_THRESHOLD", threshold: 1.5 });
    expect(next.networkThreshold).toBe(1);
  });

  it("clamps the threshold to [0, 1] from below", () => {
    const next = reduce(initialState, { type: "SET_THRESHOLD", threshold: -0.2 });
    expect(next.networkThreshold).toBe(0);
  });

  it("switches the selected method", () => {
    const next = reduce(initialState, {
      type: "SET_METHOD",
      methodId: "verb-morphology-tfidf-cosine",
    });
    expect(next.selectedMethodId).toBe("verb-morphology-tfidf-cosine");
  });

  it("switches the reference color mode", () => {
    const next = reduce(initialState, { type: "SET_REFERENCE_COLOR_MODE", mode: "genre" });
    expect(next.referenceColorMode).toBe("genre");
  });

  it("does not mutate the input state", () => {
    const before = { ...initialState };
    reduce(initialState, { type: "SELECT_PSALM", psalm: 5 });
    expect(initialState).toEqual(before);
  });
});

describe("Store", () => {
  it("starts with the given initial state", () => {
    const store = new Store({ ...initialState, selectedPsalm: 7 });
    expect(store.getState().selectedPsalm).toBe(7);
  });

  it("notifies subscribers on dispatch with the new state", () => {
    const store = new Store();
    const listener = vi.fn();
    store.subscribe(listener);
    store.dispatch({ type: "SELECT_PSALM", psalm: 42 });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ selectedPsalm: 42 }),
    );
  });

  it("stops notifying after unsubscribe", () => {
    const store = new Store();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.dispatch({ type: "SELECT_PSALM", psalm: 42 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple independent subscribers", () => {
    const store = new Store();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    store.subscribe(b);
    store.dispatch({ type: "SET_VIEW", view: "network" });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
