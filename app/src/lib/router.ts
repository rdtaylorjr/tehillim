/** The app's two pages. Client-side only - there is no server-side router,
 * so any URL that reaches this function has already been resolved to
 * index.html by the host's SPA fallback (see wrangler.jsonc's
 * not_found_handling) or by an in-app navigation. */
export type Route = "compare" | "cluster";

/** Maps a URL pathname to a Route. Strips a query string/hash fragment and
 * any trailing slashes before matching, so `/cluster`, `/cluster/`, and
 * `/cluster/?psalm=23` all resolve the same way. Anything that isn't
 * exactly `/cluster` falls back to `compare` rather than erroring - there
 * is no 404 page, since every reachable path is one of these two. This
 * includes the bare root path `/`, which is always canonicalized to
 * `/compare/` on load (see main.ts) rather than treated as its own URL. */
export function parseRoute(pathname: string): Route {
  const normalized = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return normalized === "/cluster" ? "cluster" : "compare";
}

/** The canonical URL for a Route - the inverse of parseRoute, used to build
 * `history.pushState`/`replaceState` targets and nav-link `href`s. */
export function routePath(route: Route): string {
  return route === "cluster" ? "/cluster/" : "/compare/";
}
