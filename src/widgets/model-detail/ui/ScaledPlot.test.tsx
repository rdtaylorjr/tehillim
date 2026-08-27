import { describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ScaledPlot } from "./ScaledPlot";
import type { ObserverFactory } from "./ScaledPlot";

/** Drives measurement by hand, since jsdom reports every width as zero. */
function observerAt(): { factory: ObserverFactory; fire: () => void } {
  let cb = (): void => undefined;
  const factory: ObserverFactory = (callback) => {
    cb = callback;
    return { observe: () => undefined, disconnect: () => undefined };
  };
  return {
    factory,
    fire: () => {
      cb();
    },
  };
}

const drawSized = (w: number, h: number) => (mount: HTMLElement) => {
  const plot = document.createElement("div");
  plot.className = "js-plotly-plot";
  Object.defineProperty(plot, "offsetWidth", { value: w, configurable: true });
  Object.defineProperty(plot, "offsetHeight", { value: h, configurable: true });
  mount.appendChild(plot);
};

describe("ScaledPlot", () => {
  it("draws the chart at its authored size", () => {
    cleanup();
    const draw = vi.fn();
    render(
      <ScaledPlot draw={draw} purge={() => undefined} createObserver={observerAt().factory} />,
    );
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it("leaves a chart unscaled when the container is wide enough", () => {
    cleanup();
    const { factory } = observerAt();
    const { container } = render(
      <ScaledPlot
        draw={drawSized(1020, 880)}
        purge={() => undefined}
        createObserver={factory}
      />,
    );
    const inner = container.querySelector<HTMLElement>("[data-scaled]");
    expect(inner?.style.transform === "" || inner?.style.transform === "scale(1)").toBe(true);
  });

  it("tears the plot down on unmount", () => {
    cleanup();
    const purge = vi.fn();
    const { unmount } = render(
      <ScaledPlot draw={() => undefined} purge={purge} createObserver={observerAt().factory} />,
    );
    unmount();
    expect(purge).toHaveBeenCalledTimes(1);
  });

  it("stops observing when it goes away", () => {
    cleanup();
    const disconnect = vi.fn();
    const factory: ObserverFactory = () => ({ observe: () => undefined, disconnect });
    const { unmount } = render(
      <ScaledPlot draw={() => undefined} purge={() => undefined} createObserver={factory} />,
    );
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
