/** jsdom has no layout and so no `scrollIntoView`, stubbed here rather than guarded. */
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {
    // Nothing to scroll: there is no viewport and no layout to scroll it in.
  };
}
