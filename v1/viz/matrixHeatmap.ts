export interface MatrixHeatmapHoverInfo {
  rowPsalm: number;
  colPsalm: number;
  value: number;
}

export interface MatrixHeatmapOptions {
  container: HTMLElement;
  /** Psalm numbers in the order `matrix` is indexed by: `matrix[i][j]`
   * pairs `psalmNumbers[i]` with `psalmNumbers[j]`. */
  psalmNumbers: readonly number[];
  matrix: readonly (readonly number[])[];
  /** Psalm numbers in the order to render (rows and columns both use this
   * order). Defaults to `psalmNumbers` - i.e. no reordering. */
  displayOrder?: readonly number[];
  colorScale: (value: number) => string;
  /** Divider-line positions, in display-order cell counts (e.g. book or
   * cluster boundaries). */
  boundaries?: readonly number[];
  tooltipFor: (info: MatrixHeatmapHoverInfo) => string;
  onSelect: (psalm: number) => void;
}

/** The page ground, so the diagonal reads as a gap rather than a value. */
const DIAGONAL_COLOR = "#121417";
const GRID_LINE_COLOR = "rgb(255 255 255 / 40%)";
/** The accent, so a selected row/column is told apart from a transient hover. */
const SELECTION_COLOR = "#7ba3d9";
const HOVER_COLOR = "rgb(255 255 255 / 90%)";

/**
 * Generic canvas-rendered NxN matrix heatmap with hover/click interaction, an
 * arbitrary display order, and optional divider lines. Imperative on purpose:
 * 22,500 cells are drawn to a canvas rather than reconciled as elements, and
 * the redraw is driven by a ResizeObserver rather than a render pass.
 */
export class MatrixHeatmap {
  private readonly container: HTMLElement;
  private readonly matrix: readonly (readonly number[])[];
  private readonly order: readonly number[];
  private readonly orderIndices: readonly number[];
  private readonly colorScale: (value: number) => string;
  private readonly boundaries: readonly number[];
  private readonly tooltipFor: (info: MatrixHeatmapHoverInfo) => string;
  private readonly onSelect: (psalm: number) => void;

  private readonly base: HTMLCanvasElement;
  private readonly overlay: HTMLCanvasElement;
  private readonly tooltip: HTMLDivElement;

  private size = 0;
  private cellSize = 0;
  private selected: number | null = null;
  private readonly resizeObserver: ResizeObserver;

  constructor(options: MatrixHeatmapOptions, classNames: { tooltip: string }) {
    this.container = options.container;
    this.matrix = options.matrix;
    this.order = options.displayOrder ?? options.psalmNumbers;
    const indexOfPsalm = new Map(options.psalmNumbers.map((psalm, index) => [psalm, index]));
    this.orderIndices = this.order.map((psalm) => {
      const index = indexOfPsalm.get(psalm);
      if (index === undefined) {
        throw new RangeError(
          `MatrixHeatmap: displayOrder references unknown psalm ${String(psalm)}`,
        );
      }
      return index;
    });
    this.colorScale = options.colorScale;
    this.boundaries = options.boundaries ?? [];
    this.tooltipFor = options.tooltipFor;
    this.onSelect = options.onSelect;

    this.container.innerHTML = "";
    this.base = document.createElement("canvas");
    this.overlay = document.createElement("canvas");
    this.tooltip = document.createElement("div");
    this.tooltip.className = classNames.tooltip;
    this.tooltip.hidden = true;
    this.container.append(this.base, this.overlay, this.tooltip);

    this.overlay.addEventListener("mousemove", this.handleMouseMove);
    this.overlay.addEventListener("mouseleave", this.handleMouseLeave);
    this.overlay.addEventListener("click", this.handleClick);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(this.container);
    this.resize();
  }

  setSelected(psalm: number | null): void {
    this.selected = psalm;
    this.drawOverlay(null);
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    this.overlay.removeEventListener("mousemove", this.handleMouseMove);
    this.overlay.removeEventListener("mouseleave", this.handleMouseLeave);
    this.overlay.removeEventListener("click", this.handleClick);
    this.container.innerHTML = "";
  }

  private valueAt(displayRow: number, displayCol: number): number {
    const i = this.orderIndices[displayRow];
    const j = this.orderIndices[displayCol];
    if (i === undefined || j === undefined) return 0;
    return this.matrix[i]?.[j] ?? 0;
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.size = Math.max(rect.width, 1);
    this.cellSize = this.size / this.order.length;
    const dpr = window.devicePixelRatio || 1;

    for (const canvas of [this.base, this.overlay]) {
      canvas.width = this.size * dpr;
      canvas.height = this.size * dpr;
      canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    this.drawBase();
    this.drawOverlay(null);
  }

  private drawBase(): void {
    const ctx = this.base.getContext("2d");
    if (!ctx) return;
    const n = this.order.length;
    const c = this.cellSize;

    ctx.clearRect(0, 0, this.size, this.size);
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        ctx.fillStyle = row === col ? DIAGONAL_COLOR : this.colorScale(this.valueAt(row, col));
        ctx.fillRect(col * c, row * c, Math.ceil(c) + 0.5, Math.ceil(c) + 0.5);
      }
    }

    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (const boundary of this.boundaries) {
      const pos = boundary * c;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, this.size);
      ctx.moveTo(0, pos);
      ctx.lineTo(this.size, pos);
      ctx.stroke();
    }
  }

  private drawOverlay(hover: { row: number; col: number } | null): void {
    const ctx = this.overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, this.size, this.size);
    const c = this.cellSize;

    if (this.selected !== null) {
      const row = this.order.indexOf(this.selected);
      if (row >= 0) {
        ctx.strokeStyle = SELECTION_COLOR;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, row * c, this.size, c);
        ctx.strokeRect(row * c, 0, c, this.size);
      }
    }

    if (hover) {
      ctx.strokeStyle = HOVER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(hover.col * c, 0, c, this.size);
      ctx.strokeRect(0, hover.row * c, this.size, c);
    }
  }

  private cellAt(event: MouseEvent): { row: number; col: number } {
    const rect = this.overlay.getBoundingClientRect();
    const n = this.order.length;
    const col = Math.min(
      n - 1,
      Math.max(0, Math.floor((event.clientX - rect.left) / this.cellSize)),
    );
    const row = Math.min(
      n - 1,
      Math.max(0, Math.floor((event.clientY - rect.top) / this.cellSize)),
    );
    return { row, col };
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    const cell = this.cellAt(event);
    this.drawOverlay(cell);

    const rowPsalm = this.order[cell.row];
    const colPsalm = this.order[cell.col];
    if (rowPsalm === undefined || colPsalm === undefined) return;

    const rect = this.container.getBoundingClientRect();
    this.tooltip.hidden = false;
    this.tooltip.style.left = `${String(event.clientX - rect.left)}px`;
    this.tooltip.style.top = `${String(event.clientY - rect.top)}px`;
    this.tooltip.innerHTML = this.tooltipFor({
      rowPsalm,
      colPsalm,
      value: this.valueAt(cell.row, cell.col),
    });
  };

  private readonly handleMouseLeave = (): void => {
    this.tooltip.hidden = true;
    this.drawOverlay(null);
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const cell = this.cellAt(event);
    const psalm = this.order[cell.row];
    if (psalm !== undefined) this.onSelect(psalm);
  };
}
