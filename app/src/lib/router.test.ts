import { describe, expect, it } from "vitest";
import { parseRoute, routePath } from "./router";

describe("parseRoute", () => {
  it("maps the root path to compare", () => {
    expect(parseRoute("/")).toBe("compare");
  });

  it("maps /compare/ to compare", () => {
    expect(parseRoute("/compare/")).toBe("compare");
  });

  it("maps /compare (no trailing slash) to compare", () => {
    expect(parseRoute("/compare")).toBe("compare");
  });

  it("maps /cluster/ to cluster", () => {
    expect(parseRoute("/cluster/")).toBe("cluster");
  });

  it("maps /cluster (no trailing slash) to cluster", () => {
    expect(parseRoute("/cluster")).toBe("cluster");
  });

  it("falls back to compare for an empty path", () => {
    expect(parseRoute("")).toBe("compare");
  });

  it("falls back to compare for an unknown path", () => {
    expect(parseRoute("/nonexistent")).toBe("compare");
  });

  it("falls back to compare for the legacy /genre/ path", () => {
    // /genre/ is served by its own static redirect stub outside the app
    // (see repo-root genre/index.html) - the SPA router itself never needs
    // to recognize it, but a stray direct hit should still land somewhere
    // sane rather than erroring.
    expect(parseRoute("/genre/")).toBe("compare");
  });

  it("is case-sensitive - /Cluster/ is not /cluster/", () => {
    expect(parseRoute("/Cluster/")).toBe("compare");
  });

  it("ignores a trailing query string", () => {
    expect(parseRoute("/cluster/?psalm=23")).toBe("cluster");
  });

  it("ignores multiple trailing slashes", () => {
    expect(parseRoute("/cluster//")).toBe("cluster");
  });
});

describe("routePath", () => {
  it("maps compare to /compare/", () => {
    expect(routePath("compare")).toBe("/compare/");
  });

  it("maps cluster to /cluster/", () => {
    expect(routePath("cluster")).toBe("/cluster/");
  });
});

describe("parseRoute and routePath round-trip", () => {
  it("routePath(parseRoute(path)) is idempotent for both routes", () => {
    for (const route of ["compare", "cluster"] as const) {
      expect(parseRoute(routePath(route))).toBe(route);
    }
  });
});
