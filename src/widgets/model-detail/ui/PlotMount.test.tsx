import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { PlotMount } from "./PlotMount";

class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly callback: () => void;
  disconnected = false;

  constructor(callback: () => void) {
    this.callback = callback;
    FakeObserver.instances.push(this);
  }

  observe(): void {
    return undefined;
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", FakeObserver);
});

describe("PlotMount", () => {
  it("draws into a real element once mounted", () => {
    cleanup();
    const draw = vi.fn();
    render(<PlotMount draw={draw} />);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(draw.mock.calls[0]?.[0]).toBeInstanceOf(HTMLElement);
  });

  it("tears the plot down when the element goes away, so Plotly leaves no listeners behind", () => {
    cleanup();
    const purge = vi.fn();
    const { unmount } = render(<PlotMount draw={() => undefined} purge={purge} />);
    expect(purge).not.toHaveBeenCalled();
    unmount();
    expect(purge).toHaveBeenCalledTimes(1);
  });

  it("redraws when the drawing changes, and not otherwise", () => {
    cleanup();
    const first = vi.fn();
    const { rerender } = render(<PlotMount draw={first} />);
    rerender(<PlotMount draw={first} />);
    expect(first).toHaveBeenCalledTimes(1);

    const second = vi.fn();
    rerender(<PlotMount draw={second} />);
    expect(second).toHaveBeenCalledTimes(1);
  });
  it("resizes once the drag settles, rather than on every resize event", () => {
    cleanup();
    vi.useFakeTimers();
    const resize = vi.fn();
    render(<PlotMount draw={() => undefined} resize={resize} />);
    const observer = FakeObserver.instances[0];
    observer?.callback();
    observer?.callback();
    expect(resize).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(resize).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("drops a pending resize on unmount, so it never fires into a gone element", () => {
    cleanup();
    vi.useFakeTimers();
    const resize = vi.fn();
    const { unmount } = render(<PlotMount draw={() => undefined} resize={resize} />);
    FakeObserver.instances[0]?.callback();
    unmount();
    vi.runAllTimers();
    expect(resize).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("falls back to Plotly's own resize when the caller supplies none", async () => {
    cleanup();
    vi.useFakeTimers();
    const plotly = await import("plotly.js-dist-min");
    const resize = vi.spyOn(plotly.default.Plots, "resize").mockImplementation(() => undefined);
    render(<PlotMount draw={() => undefined} />);
    FakeObserver.instances[0]?.callback();
    vi.runAllTimers();
    expect(resize).toHaveBeenCalledTimes(1);
    resize.mockRestore();
    vi.useRealTimers();
  });

  it("stops observing on unmount", () => {
    cleanup();
    const { unmount } = render(<PlotMount draw={() => undefined} />);
    const observer = FakeObserver.instances[0];
    unmount();
    expect(observer?.disconnected).toBe(true);
  });
});
