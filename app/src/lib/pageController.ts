/** What the SPA shell (main.ts) needs from a mounted page: a way to tear it
 * back down (unsubscribe its store, destroy its D3 visualizations) before
 * mounting whichever page comes next into the same root element. */
export interface PageController {
  unmount(): void;
}
