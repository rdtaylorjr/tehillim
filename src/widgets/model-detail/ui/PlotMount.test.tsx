import { describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { PlotMount } from "./PlotMount";

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
});
