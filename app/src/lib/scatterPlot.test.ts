import { describe, expect, it } from "vitest";
import type { ClusterMethodPayload, GenreAlignment, PsalmCore } from "../types";
import {
  buildPoints,
  isBackgroundClick,
  isHullDimmed,
  isPointDimmed,
  selectedCluster,
  type Point,
} from "./scatterPlot";

function psalms(numbers: number[]): PsalmCore[] {
  return numbers.map((number) => ({ number, verseCount: 1, wordCount: 1, incipit: "" }));
}

const EMPTY_ALIGNMENT: GenreAlignment = {
  genres: [],
  counts: [],
  genreTotals: [],
  clusterGenreLabels: [],
  purity: 0,
  ami: 0,
  ari: 0,
  amiPValue: 1,
  amiPValueAdjusted: 1,
};

function makeMethod(overrides: Partial<ClusterMethodPayload> = {}): ClusterMethodPayload {
  return {
    id: "test-method",
    description: "",
    nClusters: 2,
    partitionPValue: null,
    kStability: null,
    assignments: {},
    clusters: [],
    embedding: { x: [], y: [], structureCaptured: 1 },
    genreAlignment: EMPTY_ALIGNMENT,
    familyAlignment: EMPTY_ALIGNMENT,
    ...overrides,
  };
}

describe("buildPoints", () => {
  it("pairs each psalm with its embedding coordinates and cluster, in order", () => {
    const method = makeMethod({
      embedding: { x: [0.1, 0.2], y: [-0.3, 0.4], structureCaptured: 1 },
      assignments: { "1": 0, "2": 1 },
    });
    expect(buildPoints(psalms([1, 2]), method)).toEqual([
      { psalm: 1, x: 0.1, y: -0.3, cluster: 0 },
      { psalm: 2, x: 0.2, y: 0.4, cluster: 1 },
    ]);
  });

  it("defaults missing embedding coordinates to 0", () => {
    const method = makeMethod({
      embedding: { x: [], y: [], structureCaptured: 1 },
      assignments: { "1": 0 },
    });
    const [point] = buildPoints(psalms([1]), method);
    expect(point.x).toBe(0);
    expect(point.y).toBe(0);
  });

  it("defaults an unassigned psalm's cluster to -1", () => {
    const method = makeMethod({ embedding: { x: [0], y: [0], structureCaptured: 1 }, assignments: {} });
    const [point] = buildPoints(psalms([1]), method);
    expect(point.cluster).toBe(-1);
  });
});

describe("selectedCluster", () => {
  const pointByPsalm = new Map<number, Point>([
    [1, { psalm: 1, x: 0, y: 0, cluster: 2 }],
    [2, { psalm: 2, x: 0, y: 0, cluster: 5 }],
  ]);

  it("returns the selected psalm's cluster", () => {
    expect(selectedCluster(pointByPsalm, 2)).toBe(5);
  });

  it("returns null when nothing is selected", () => {
    expect(selectedCluster(pointByPsalm, null)).toBeNull();
  });

  it("returns null for a psalm outside the point set", () => {
    expect(selectedCluster(pointByPsalm, 99)).toBeNull();
  });
});

describe("isPointDimmed", () => {
  it("dims a point outside the selected cluster", () => {
    const point: Point = { psalm: 5, x: 0, y: 0, cluster: 1 };
    expect(isPointDimmed(point, 1, 0)).toBe(true);
  });

  it("does not dim a point inside the selected cluster", () => {
    const point: Point = { psalm: 5, x: 0, y: 0, cluster: 0 };
    expect(isPointDimmed(point, 1, 0)).toBe(false);
  });

  it("never dims the selected point itself, even if its cluster looks stale", () => {
    const point: Point = { psalm: 1, x: 0, y: 0, cluster: 3 };
    expect(isPointDimmed(point, 1, 0)).toBe(false);
  });

  it("dims nothing when no cluster is selected", () => {
    const point: Point = { psalm: 5, x: 0, y: 0, cluster: 1 };
    expect(isPointDimmed(point, null, null)).toBe(false);
  });
});

describe("isHullDimmed", () => {
  it("dims a hull that isn't the selected cluster", () => {
    expect(isHullDimmed(2, 0)).toBe(true);
  });

  it("does not dim the selected cluster's own hull", () => {
    expect(isHullDimmed(0, 0)).toBe(false);
  });

  it("dims nothing when no cluster is selected", () => {
    expect(isHullDimmed(2, null)).toBe(false);
  });
});

// Stand-ins for DOM nodes: this test runs under vitest's "node" environment
// (see vite.config.ts), so isBackgroundClick's identity check is exercised
// against plain objects rather than real Elements - it only ever compares
// reference equality, so the concrete type doesn't matter.
function fakeNode(): EventTarget {
  return {} as EventTarget;
}

describe("isBackgroundClick", () => {
  it("is true when the click target is the background element itself", () => {
    const el = fakeNode();
    expect(isBackgroundClick(el, el)).toBe(true);
  });

  it("is false when the click target is some other element", () => {
    expect(isBackgroundClick(fakeNode(), fakeNode())).toBe(false);
  });

  it("is false when the background reference is null", () => {
    expect(isBackgroundClick(fakeNode(), null)).toBe(false);
  });
});
