/**
 * jsdom implements no layout, so it ships no `scrollIntoView` at all. The psalm
 * picker calls it to bring a selection made elsewhere into view, which is real
 * behaviour in a browser and simply absent here. Stubbing it in the harness
 * keeps that call honest in production rather than guarding it against a gap
 * that only exists in tests.
 */
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {
    // Nothing to scroll: there is no viewport and no layout to scroll it in.
  };
}
