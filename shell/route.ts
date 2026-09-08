import { SITE } from "../src/shared/lib/attribution";

/** The site's five pages, resolved client-side by the host's SPA fallback. */
export type Route = "home" | "compare" | "cluster" | "benchmark" | "references";

/** Which page, and on the benchmark page which model's charts are open. */
export interface Location {
  readonly route: Route;
  readonly model: string | null;
}

/** Path segments with query, hash and empty segments dropped. */
function segmentsOf(pathname: string): string[] {
  const path = (pathname.split("?")[0] ?? "").split("#")[0] ?? "";
  return path.split("/").filter((segment) => segment !== "");
}

/** Maps a pathname to a Location, per segment, falling back to the landing page. */
export function parseLocation(pathname: string): Location {
  const [first, second] = segmentsOf(pathname);
  if (first === "compare") return { route: "compare", model: null };
  if (first === "cluster") return { route: "cluster", model: null };
  if (first === "references") return { route: "references", model: null };
  if (first === "benchmark") {
    //: decodeURIComponent throws on a malformed escape, so the table opens instead.
    let model: string | null = null;
    if (second !== undefined) {
      try {
        model = decodeURIComponent(second);
      } catch {
        model = null;
      }
    }
    return { route: "benchmark", model };
  }
  return { route: "home", model: null };
}

/** Just the page, for the header, the tab title and the nav. */
export function parseRoute(pathname: string): Route {
  return parseLocation(pathname).route;
}

/** The canonical URL for a Route. The landing page is the root itself. */
export function routePath(route: Route): string {
  return route === "home" ? "/" : `/${route}/`;
}

/** The canonical URL for a Location, the inverse of parseLocation. */
export function locationPath(location: Location): string {
  if (location.route === "benchmark" && location.model !== null) {
    return `/benchmark/${encodeURIComponent(location.model)}/`;
  }
  return routePath(location.route);
}

/** Every page, in reading order. */
export const ROUTES: readonly Route[] = [
  "home",
  "benchmark",
  "compare",
  "cluster",
  "references",
];

/** What the header nav lists, in order. Home is absent: the site name is the way back. */
export const NAV_ROUTES: readonly Route[] = ["benchmark", "compare", "cluster", "references"];

/** What each page is called in the header nav, in a single word. */
export function routeLabel(route: Route): string {
  switch (route) {
    case "home":
      return "Home";
    case "cluster":
      return "Cluster";
    case "benchmark":
      return "Benchmark";
    case "references":
      return "References";
    case "compare":
      return "Compare";
  }
}

/** The page's nav name then the site, since a tab truncates from the right. */
export function routeTitle(route: Route): string {
  // The front door carries the bare name, with no page name to put first.
  if (route === "home") return SITE.name;
  return `${routeLabel(route)} \u00b7 ${SITE.name}`;
}

/** The page's title, or the open model in its place, so restored tabs differ. */
export function locationTitle(location: Location): string {
  if (location.route === "benchmark" && location.model !== null) {
    return `${location.model} \u00b7 ${SITE.name}`;
  }
  return routeTitle(location.route);
}
