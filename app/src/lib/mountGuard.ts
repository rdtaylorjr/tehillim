/**
 * Guards against a page-mount race on rapid client-side navigation: if the
 * user navigates away before an in-flight page's data fetch resolves, that
 * fetch must not go on to wire itself onto the DOM the *new* page just
 * rendered (both pages reuse several of the same element ids - e.g.
 * `#detail-panel`, `#psalm-grid` - so a stale mount would otherwise attach
 * its own listeners to, or overwrite, the current page's live elements).
 *
 * Each call to `next()` claims the current turn and invalidates every
 * earlier one still in flight; that turn's own `isStale()` reports whether
 * a later turn has since been claimed, so a page-mount function can check
 * it right after its await and bail out before touching the DOM.
 */
export function createMountGuard(): { next(): { isStale: () => boolean } } {
  let currentTurn = 0;

  return {
    next(): { isStale: () => boolean } {
      const myTurn = ++currentTurn;
      return { isStale: () => myTurn !== currentTurn };
    },
  };
}
