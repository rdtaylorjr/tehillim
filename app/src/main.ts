import "./style.css";
import { createMountGuard } from "./lib/mountGuard";
import type { PageController } from "./lib/pageController";
import { parseRoute, routePath, type Route } from "./lib/router";
import { mountClusterPage } from "./pages/clusterPage";
import { mountComparePage } from "./pages/comparePage";

/** True for a plain left-click with no modifier keys - anything else
 * (cmd/ctrl/shift/alt, or a non-primary button) should fall through to the
 * browser's own "open in new tab"/"open in new window" handling rather
 * than being intercepted by the SPA router. */
function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  );
}

function requireAppRoot(): HTMLElement {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app root element");
  return app;
}

async function main(): Promise<void> {
  const app = requireAppRoot();
  const guard = createMountGuard();
  let current: PageController | null = null;

  // Tears the current page down before mounting the next one, so a
  // superseded page's resources (store subscription, D3 ResizeObservers
  // and force simulations) are released immediately rather than lingering
  // for however long the new page's data fetch takes. `isStale` (see
  // lib/mountGuard.ts) guards against the opposite race - navigating away
  // again before *this* mount's own fetch has resolved - so a mount that's
  // no longer relevant never wires itself onto a DOM that now belongs to a
  // different page.
  const mountRoute = async (route: Route): Promise<void> => {
    current?.unmount();
    current = null;

    const { isStale } = guard.next();
    const controller =
      route === "cluster" ? await mountClusterPage(app, isStale) : await mountComparePage(app, isStale);

    if (isStale()) {
      controller.unmount();
      return;
    }
    current = controller;
  };

  app.addEventListener("click", (event) => {
    if (!isPlainLeftClick(event)) return;
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("[data-route]");
    if (!link) return;

    const route = link.dataset.route as Route;
    event.preventDefault();
    if (route === parseRoute(location.pathname)) return;

    history.pushState(null, "", routePath(route));
    void mountRoute(route);
  });

  window.addEventListener("popstate", () => {
    void mountRoute(parseRoute(location.pathname));
  });

  // Canonicalize on load: a bare "/" (or any other path that doesn't match
  // its own route's canonical URL - no trailing slash, or an unknown path
  // that fell back to compare) is rewritten in place before mounting, so
  // the address bar always reflects an actual route rather than a path
  // that merely happened to resolve to one.
  const initialRoute = parseRoute(location.pathname);
  const canonicalPath = routePath(initialRoute);
  if (location.pathname !== canonicalPath) {
    history.replaceState(null, "", canonicalPath + location.search + location.hash);
  }
  await mountRoute(initialRoute);
}

main().catch((error: unknown) => {
  console.error(error);
});
