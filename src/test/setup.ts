import "@testing-library/jest-dom/vitest";

const noop = (): void => undefined;

/** jsdom has no ResizeObserver, and reports every width as zero, so observation is inert here. */
class InertResizeObserver {
  readonly observe = noop;
  readonly unobserve = noop;
  readonly disconnect = noop;
}

globalThis.ResizeObserver = InertResizeObserver;

/** jsdom implements no object URLs, which Plotly touches on import. */
globalThis.URL.createObjectURL = () => "blob:inert";
globalThis.URL.revokeObjectURL = noop;
