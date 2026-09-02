import { SITE } from "../src/shared/lib/attribution";

/** The site's three pages. Client-side only - there is no server-side router,
 * so any URL that reaches this function has already been resolved to
 * index.html by the host's SPA fallback (see wrangler.jsonc's
 * not_found_handling) or by an in-app navigation. */
export type Route = "compare" | "cluster" | "benchmark";

/** Maps a URL pathname to a Route. Strips a query string/hash fragment and
 * any trailing slashes before matching, so `/cluster`, `/cluster/`, and
 * `/cluster/?psalm=23` all resolve the same way. Anything unrecognized falls
 * back to `compare` rather than erroring - there is no 404 page, since every
 * reachable path is one of these three. This includes the bare root path `/`,
 * which is always canonicalized to `/compare/` on load (see Root.tsx) rather
 * than treated as its own URL. */
export function parseRoute(pathname: string): Route {
  const normalized = (pathname.split("?")[0] ?? "").split("#")[0]?.replace(/\/+$/, "") ?? "";
  if (normalized === "/cluster") return "cluster";
  if (normalized === "/benchmark") return "benchmark";
  return "compare";
}

/** The canonical URL for a Route - the inverse of parseRoute, used to build
 * `history.pushState`/`replaceState` targets and nav-link `href`s. */
export function routePath(route: Route): string {
  return `/${route}/`;
}

/**
 * The line under the title, naming what this page shows. All three share one
 * shape: the corpus, a modifier, and a head noun naming the artifact - "Hebrew
 * Psalm Representation Benchmarks" is the pattern the other two follow. Title
 * case throughout, since each reads as the name of a body of work rather than a
 * description of it. The benchmark page's own copy stays in `attribution.ts`,
 * which the benchmarks app reads directly.
 */
export function routeSubtitle(route: Route): string {
  switch (route) {
    case "cluster":
      return "Hebrew Psalm Unsupervised Clustering";
    case "benchmark":
      return SITE.subtitle;
    case "compare":
      return "Hebrew Psalm Pairwise Similarity";
  }
}

/** What the tab reads for each page. */
export function routeTitle(route: Route): string {
  switch (route) {
    case "cluster":
      return "Cluster the Psalms";
    case "benchmark":
      // A tab title is unstyled text, with no weight or color to mark the break,
      // so this is the one place the separator character still earns its keep.
      return SITE.title;
    case "compare":
      return "Compare the Psalms";
  }
}
