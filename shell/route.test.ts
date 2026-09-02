import { describe, expect, it } from "vitest";
import { parseRoute, routePath, routeSubtitle, routeTitle } from "./route";
import type { Route } from "./route";

const ROUTES: readonly Route[] = ["compare", "cluster", "benchmark"];

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

  it("maps /benchmark/ to benchmark", () => {
    expect(parseRoute("/benchmark/")).toBe("benchmark");
  });

  it("maps /benchmark (no trailing slash) to benchmark", () => {
    expect(parseRoute("/benchmark")).toBe("benchmark");
  });

  it("does not answer to the plural /benchmarks", () => {
    // The route is singular. The plural is not an alias, it is simply unknown,
    // and unknown paths land on compare like any other.
    expect(parseRoute("/benchmarks")).toBe("compare");
  });

  it("falls back to compare for an empty path", () => {
    expect(parseRoute("")).toBe("compare");
  });

  it("falls back to compare for an unknown path", () => {
    expect(parseRoute("/nonexistent")).toBe("compare");
  });

  it("falls back to compare for the legacy /genre/ path", () => {
    expect(parseRoute("/genre/")).toBe("compare");
  });

  it("is case-sensitive - /Cluster/ is not /cluster/", () => {
    expect(parseRoute("/Cluster/")).toBe("compare");
  });

  it("ignores a trailing query string", () => {
    expect(parseRoute("/cluster/?psalm=23")).toBe("cluster");
  });

  it("ignores a hash fragment", () => {
    expect(parseRoute("/benchmark/#top")).toBe("benchmark");
  });

  it("ignores multiple trailing slashes", () => {
    expect(parseRoute("/cluster//")).toBe("cluster");
  });
});

describe("routePath", () => {
  it("maps each route to its own canonical path", () => {
    expect(routePath("compare")).toBe("/compare/");
    expect(routePath("cluster")).toBe("/cluster/");
    expect(routePath("benchmark")).toBe("/benchmark/");
  });
});

describe("parseRoute and routePath round-trip", () => {
  it("routePath(parseRoute(path)) is idempotent for every route", () => {
    for (const route of ROUTES) {
      expect(parseRoute(routePath(route))).toBe(route);
    }
  });
});

describe("routeTitle", () => {
  it("gives every route a non-empty title", () => {
    for (const route of ROUTES) {
      expect(routeTitle(route)).not.toBe("");
    }
  });

  it("gives the three routes three distinct titles", () => {
    expect(new Set(ROUTES.map(routeTitle)).size).toBe(ROUTES.length);
  });
});

describe("routeTitle vs the rendered heading", () => {
  it("keeps a separator character, having no weight or color to mark the break", () => {
    // The heading drops the separator because it can style the two halves. A tab
    // title is plain text with no such option, so there it still earns its keep.
    expect(routeTitle("benchmark")).toContain("·");
  });
});

describe("routeSubtitle", () => {
  const SUBTITLES = ROUTES.map(routeSubtitle);

  it("gives every route its own subtitle", () => {
    expect(new Set(SUBTITLES).size).toBe(ROUTES.length);
  });

  it("names the page's own body of work", () => {
    expect(routeSubtitle("compare")).toBe("Hebrew Psalm Pairwise Similarity");
    expect(routeSubtitle("cluster")).toBe("Hebrew Psalm Unsupervised Clustering");
    expect(routeSubtitle("benchmark")).toBe("Hebrew Psalm Representation Benchmarks");
  });

  it("opens each on the corpus, so the three read as one series", () => {
    for (const subtitle of SUBTITLES) {
      expect(subtitle.startsWith("Hebrew Psalm ")).toBe(true);
    }
  });

  it("keeps all three in title case, each naming a body of work", () => {
    for (const subtitle of SUBTITLES) {
      expect(subtitle.split(" ").filter((w) => !/^[A-Z]/.test(w))).toEqual([]);
    }
  });

  it("gives each the same three-part shape: corpus, modifier, head noun", () => {
    for (const subtitle of SUBTITLES) {
      expect(subtitle.split(" ")).toHaveLength(4);
    }
  });

  it("keeps them close enough in length that none is the odd one out", () => {
    const lengths = SUBTITLES.map((s) => s.length);
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(8);
  });
});
