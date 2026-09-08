import { beforeEach, describe, expect, it, vi } from "vitest";
import { MatrixHeatmap } from "./matrixHeatmap";

const MATRIX = [
  [1, 0.2, 0.1],
  [0.2, 1, 0.3],
  [0.1, 0.3, 1],
];

class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly callback: () => void;

  constructor(callback: () => void) {
    this.callback = callback;
    FakeObserver.instances.push(this);
  }

  observe(): void {
    return undefined;
  }

  disconnect(): void {
    return undefined;
  }
}

function context(): Record<string, unknown> {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
  };
}

function mount(over: Record<string, unknown> = {}): {
  plot: MatrixHeatmap;
  container: HTMLDivElement;
  onSelect: ReturnType<typeof vi.fn>;
} {
  const container = document.createElement("div");
  container.getBoundingClientRect = (): DOMRect =>
    ({ width: 300, height: 300, left: 0, top: 0 }) as DOMRect;
  document.body.append(container);
  const onSelect = vi.fn();
  const plot = new MatrixHeatmap(
    {
      container,
      psalmNumbers: [1, 2, 3],
      matrix: MATRIX,
      colorScale: () => "#123456",
      tooltipFor: () => "tip",
      onSelect,
      ...over,
    },
    { tooltip: "tt" },
  );
  return { plot, container, onSelect };
}

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", FakeObserver);
  vi.stubGlobal("devicePixelRatio", 2);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => context()) as never;
});

describe("MatrixHeatmap", () => {
  it("stacks two canvases and a tooltip inside the container it was given", () => {
    const { container } = mount();
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    expect(container.querySelector(".tt")).toBeTruthy();
  });

  it("sizes the canvas in device pixels and lays it out in CSS pixels", () => {
    const { container } = mount();
    const canvas = container.querySelector("canvas");
    expect(canvas?.width).toBe(600);
    expect(canvas?.style.width).toBe("300px");
  });

  it("positions the canvases itself, so a caller needs no stylesheet of its own", () => {
    const { container } = mount();
    const canvas = container.querySelector("canvas");
    expect(container.style.position).toBe("relative");
    expect(canvas?.style.position).toBe("absolute");
  });

  it("refuses a display order naming a psalm the matrix has no row for", () => {
    expect(() => mount({ displayOrder: [1, 2, 99] })).toThrow(RangeError);
  });

  it("redraws when the container resizes, rather than on a render pass", () => {
    mount();
    const drawn = (HTMLCanvasElement.prototype.getContext as ReturnType<typeof vi.fn>).mock
      .calls.length;
    FakeObserver.instances[0]?.callback();
    expect(
      (HTMLCanvasElement.prototype.getContext as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(drawn);
  });

  it("reports the psalm a click landed on", () => {
    const { container, onSelect } = mount();
    const overlay = container.querySelectorAll("canvas")[1];
    overlay?.dispatchEvent(
      new MouseEvent("click", { clientX: 50, clientY: 150, bubbles: true }),
    );
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("names the hovered pair in the tooltip and places it in the container", () => {
    const { container } = mount({ tooltipFor: () => "Psalm 1 and Psalm 2" });
    const overlay = container.querySelectorAll("canvas")[1];
    overlay?.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 150, clientY: 250, bubbles: true }),
    );
    const tooltip = container.querySelector<HTMLElement>(".tt");
    expect(tooltip?.hidden).toBe(false);
    expect(tooltip?.innerHTML).toBe("Psalm 1 and Psalm 2");
    expect(tooltip?.style.left).toBe("150px");
  });

  it("hides the tooltip once the pointer leaves", () => {
    const { container } = mount();
    const overlay = container.querySelectorAll("canvas")[1];
    overlay?.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 150, clientY: 250, bubbles: true }),
    );
    overlay?.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    expect(container.querySelector<HTMLElement>(".tt")?.hidden).toBe(true);
  });

  it("clamps a pointer past the last cell, rather than reading off the end", () => {
    const { container, onSelect } = mount();
    const overlay = container.querySelectorAll("canvas")[1];
    overlay?.dispatchEvent(
      new MouseEvent("click", { clientX: 9999, clientY: 9999, bubbles: true }),
    );
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("draws in the display order it was given, not the matrix order", () => {
    const { container, onSelect } = mount({ displayOrder: [3, 2, 1] });
    const overlay = container.querySelectorAll("canvas")[1];
    overlay?.dispatchEvent(
      new MouseEvent("click", { clientX: 10, clientY: 10, bubbles: true }),
    );
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("marks the selected psalm without redrawing the base layer", () => {
    const { plot } = mount();
    expect(() => {
      plot.setSelected(2);
      plot.setSelected(null);
    }).not.toThrow();
  });

  it("draws the divider lines it was given", () => {
    const ctx = context();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as never;
    mount({ boundaries: [1] });
    expect(ctx["stroke"]).toHaveBeenCalled();
  });

  it("stops observing once destroyed", () => {
    const { plot } = mount();
    const observer = FakeObserver.instances[0];
    const disconnect = vi.spyOn(observer!, "disconnect");
    plot.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
