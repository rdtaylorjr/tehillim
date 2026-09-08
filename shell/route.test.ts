import { describe, expect, it } from "vitest";
import {
  NAV_ROUTES,
  ROUTES,
  locationPath,
  locationTitle,
  parseLocation,
  parseRoute,
  routeLabel,
  routePath,
  routeTitle,
} from "./route";

describe("parseRoute", () => {
  it("maps the root path to the landing page", () => {
    expect(parseRoute("/")).toBe("home");
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

  it("maps /references/ to references", () => {
    expect(parseRoute("/references/")).toBe("references");
  });

  it("maps /references (no trailing slash) to references", () => {
    expect(parseRoute("/references")).toBe("references");
  });

  it("does not answer to the singular /reference", () => {
    // The route is plural, naming a body of works rather than one of them.
    expect(parseRoute("/reference")).toBe("home");
  });

  it("does not answer to the plural /benchmarks", () => {
    // The route is singular. The plural is not an alias, it is simply unknown,
    // and unknown paths land on compare like any other.
    expect(parseRoute("/benchmarks")).toBe("home");
  });

  it("falls back to the landing page for an empty path", () => {
    expect(parseRoute("")).toBe("home");
  });

  it("falls back to the landing page for an unknown path", () => {
    // A mistyped URL is better answered by the page that explains what this is
    // than by dropping the reader into one of the tools.
    expect(parseRoute("/nonexistent")).toBe("home");
  });

  it("falls back to the landing page for the legacy /genre/ path", () => {
    expect(parseRoute("/genre/")).toBe("home");
  });

  it("is case-sensitive - /Cluster/ is not /cluster/", () => {
    expect(parseRoute("/Cluster/")).toBe("home");
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
    expect(routePath("references")).toBe("/references/");
  });

  it("gives the landing page the root itself, not a second address", () => {
    expect(routePath("home")).toBe("/");
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

  it("gives every route its own title", () => {
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

describe("NAV_ROUTES", () => {
  it("lists every route except home exactly once, so the nav can never omit one", () => {
    expect([...NAV_ROUTES].sort()).toEqual([...ROUTES].filter((r) => r !== "home").sort());
  });

  it("leaves home out, the masthead being the way back to it", () => {
    expect(NAV_ROUTES).not.toContain("home");
  });

  it("leads with the measurements the other two pages are built on", () => {
    expect(NAV_ROUTES[0]).toBe("benchmark");
  });
});

describe("routeLabel", () => {
  it("names every route in one word, the subtitle carrying the rest", () => {
    for (const route of ROUTES) {
      expect(routeLabel(route).split(" ")).toHaveLength(1);
    }
  });

  it("gives every route its own label", () => {
    expect(new Set(ROUTES.map(routeLabel)).size).toBe(ROUTES.length);
  });

  it("names the page rather than the path, where the two differ", () => {
    // Every label happens to be its path capitalized today. That is a fact
    // about the current names, not a rule the nav enforces, so this pins the
    // labels themselves rather than deriving them.
    expect(NAV_ROUTES.map(routeLabel)).toEqual([
      "Benchmark",
      "Compare",
      "Cluster",
      "References",
    ]);
  });
});

describe("parseLocation on the benchmark page", () => {
  it("reads the model out of the path", () => {
    expect(parseLocation("/benchmark/alephbert_consonantal/")).toEqual({
      route: "benchmark",
      model: "alephbert_consonantal",
    });
  });

  it("leaves the model null for the bare table", () => {
    expect(parseLocation("/benchmark/")).toEqual({ route: "benchmark", model: null });
  });

  it("decodes a model whose id needed escaping", () => {
    expect(parseLocation("/benchmark/bge%2Fm3/").model).toBe("bge/m3");
  });

  it("opens the table rather than throwing on a malformed escape", () => {
    // No URL this app produces looks like this, and a page that crashes is a
    // worse answer than a page that shows the table.
    expect(parseLocation("/benchmark/%/")).toEqual({ route: "benchmark", model: null });
  });

  it("ignores a model segment under any other route", () => {
    expect(parseLocation("/cluster/anything/").model).toBeNull();
  });
});

describe("locationPath", () => {
  it("round-trips every route with no model", () => {
    for (const route of ROUTES) {
      const location = { route, model: null };
      expect(parseLocation(locationPath(location))).toEqual(location);
    }
  });

  it("round-trips a model whose id needs escaping", () => {
    const location = { route: "benchmark" as const, model: "a/b c" };
    expect(parseLocation(locationPath(location))).toEqual(location);
  });

  it("drops a model that no route but benchmark can carry", () => {
    expect(locationPath({ route: "cluster", model: "ignored" })).toBe("/cluster/");
  });
});

describe("locationTitle", () => {
  it("names the open model in the page's place, for a row of restored tabs", () => {
    expect(locationTitle({ route: "benchmark", model: "berel_vocalized" })).toBe(
      "berel_vocalized \u00b7 Tehillim",
    );
  });

  it("falls back to the page's own title with no model open", () => {
    for (const route of ROUTES) {
      expect(locationTitle({ route, model: null })).toBe(routeTitle(route));
    }
  });
});
