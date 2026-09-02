import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { parseRoute, routePath, routeTitle } from "./route";
import type { Route } from "./route";

// Each branch is loaded on demand: the benchmarks table pulls Plotly, the v1
// pages pull d3, and a reader who opens one should never pay for the other.
const BenchmarksApp = lazy(async () => {
  const loaded = await import("../src/app/App");
  return { default: loaded.App };
});

const ComparePage = lazy(async () => {
  const loaded = await import("../v1/pages/ComparePage");
  return { default: loaded.ComparePage };
});

const ClusterPage = lazy(async () => {
  const loaded = await import("../v1/pages/ClusterPage");
  return { default: loaded.ClusterPage };
});

/** True for a plain left-click with no modifier keys - anything else
 * (cmd/ctrl/shift/alt, or a non-primary button) should fall through to the
 * browser's own "open in new tab"/"open in new window" handling rather
 * than being intercepted by the SPA router. */
function isPlainLeftClick(event: React.MouseEvent): boolean {
  return (
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}

export type NavigateHandler = (route: Route, event: React.MouseEvent) => void;

/**
 * The whole site's router: the v1 Compare and Cluster pages at their original
 * paths, and the benchmarks app at /benchmark. Client-side only, three
 * routes, no nesting - a routing library would be more machinery than that
 * needs, so this is `history` plus a `popstate` listener.
 */
export function Root(): React.ReactElement {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

  // Canonicalize on load: a bare "/" (or any other path that doesn't match its
  // own route's canonical URL - no trailing slash, or an unknown path that fell
  // back to compare) is rewritten in place, so the address bar always reflects
  // an actual route rather than a path that merely happened to resolve to one.
  useEffect(() => {
    const canonical = routePath(parseRoute(window.location.pathname));
    if (window.location.pathname !== canonical) {
      window.history.replaceState(
        null,
        "",
        canonical + window.location.search + window.location.hash,
      );
    }
  }, []);

  useEffect(() => {
    const onPopState = (): void => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    document.title = routeTitle(route);
  }, [route]);

  const navigate = useCallback<NavigateHandler>((next, event) => {
    if (!isPlainLeftClick(event)) return;
    event.preventDefault();
    if (next === parseRoute(window.location.pathname)) return;
    window.history.pushState(null, "", routePath(next));
    setRoute(next);
    window.scrollTo(0, 0);
  }, []);

  return (
    <Suspense fallback={<div className="route-pending" />}>
      {route === "benchmark" ? (
        <BenchmarksApp />
      ) : route === "cluster" ? (
        <ClusterPage navigate={navigate} />
      ) : (
        <ComparePage navigate={navigate} />
      )}
    </Suspense>
  );
}
