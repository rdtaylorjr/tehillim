import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { locationPath, locationTitle, parseLocation } from "./route";
import type { Location, Route } from "./route";

// Each branch is loaded on demand: the benchmarks table pulls Plotly, the similarity
// pages pull d3, and a reader who opens one should never pay for the other.
const BenchmarksApp = lazy(async () => {
  const loaded = await import("../src/app/App");
  return { default: loaded.App };
});

const ComparePage = lazy(async () => {
  const loaded = await import("../src/pages/compare/ui/ComparePage");
  return { default: loaded.ComparePage };
});

const ClusterPage = lazy(async () => {
  const loaded = await import("../src/pages/cluster/ui/ClusterPage");
  return { default: loaded.ClusterPage };
});

const ReferencesPage = lazy(async () => {
  const loaded = await import("../src/pages/references/ui/ReferencesPage");
  return { default: loaded.ReferencesPage };
});

const HomePage = lazy(async () => {
  const loaded = await import("../src/pages/home/ui/HomePage");
  return { default: loaded.HomePage };
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
 * The whole site's router: the Compare and Cluster pages at their original
 * paths, the benchmarks app at /benchmark, and the bibliography at
 * /references. Client-side only, four routes, no nesting - a routing library
 * would be more machinery than that needs, so this is `history` plus a
 * `popstate` listener.
 */
export function Root(): React.ReactElement {
  const [location, setLocation] = useState<Location>(() =>
    parseLocation(window.location.pathname),
  );
  const { route } = location;

  // Canonicalize on load: a bare "/" (or any other path that doesn't match its
  // own route's canonical URL - no trailing slash, or an unknown path that fell
  // back to compare) is rewritten in place, so the address bar always reflects
  // an actual route rather than a path that merely happened to resolve to one.
  useEffect(() => {
    const canonical = locationPath(parseLocation(window.location.pathname));
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
      setLocation(parseLocation(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    document.title = locationTitle(location);
  }, [location]);

  /** Pushes a Location and moves to it, unless it is the one already showing. */
  const go = useCallback((next: Location, scrollToTop: boolean): void => {
    const path = locationPath(next);
    if (path === locationPath(parseLocation(window.location.pathname))) return;
    window.history.pushState(null, "", path);
    setLocation(next);
    if (scrollToTop) window.scrollTo(0, 0);
  }, []);

  const navigate = useCallback<NavigateHandler>(
    (next, event) => {
      if (!isPlainLeftClick(event)) return;
      event.preventDefault();
      go({ route: next, model: null }, true);
    },
    [go],
  );

  /** Opening a model, and backing out of one, are ordinary navigations: each
   * gets a URL and a history entry, so the browser's own Back returns to the
   * table the reader came from. */
  const openModel = useCallback(
    (model: string | null): void => {
      go({ route: "benchmark", model }, true);
    },
    [go],
  );

  return (
    <Suspense fallback={<div className="route-pending" />}>
      {route === "benchmark" ? (
        <BenchmarksApp navigate={navigate} model={location.model} onOpenModel={openModel} />
      ) : route === "cluster" ? (
        <ClusterPage navigate={navigate} />
      ) : route === "references" ? (
        <ReferencesPage navigate={navigate} />
      ) : route === "compare" ? (
        <ComparePage navigate={navigate} />
      ) : (
        <HomePage navigate={navigate} />
      )}
    </Suspense>
  );
}
