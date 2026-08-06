export interface MatrixHeatmapHoverInfo {
  rowPsalm: number;
  colPsalm: number;
  value: number;
}

export interface MatrixHeatmapOptions {
  container: HTMLElement;
  /** Psalm numbers in the order `matrix` is indexed by: `matrix[i][j]`
   * pairs `psalmNumbers[i]` with `psalmNumbers[j]`. */
  psalmNumbers: number[];
  matrix: number[][];
  /** Psalm numbers in the order to render (rows and columns both use this
   * order). Defaults to `psalmNumbers` - i.e. no reordering. */
  displayOrder?: number[];
  colorScale: (value: number) => string;
  /** Divider-line positions, in display-order cell counts (e.g. book or
   * cluster boundaries). */
  boundaries?: readonly number[];
  diagonalColor?: string;
  tooltipFor: (info: MatrixHeatmapHoverInfo) => string;
  onSelect: (psalm: number) => void;
  onHover?: (info: MatrixHeatmapHoverInfo | null) => void;
}

const DEFAULT_DIAGONAL_COLOR = "#0f1519";
const GRID_LINE_COLOR = "rgba(255, 255, 255, 0.4)";

/**
 * Generic canvas-rendered NxN matrix heatmap with hover/click interaction,
 * an arbitrary display order, and optional divider lines - the shared
 * primitive behind Compare's book-ordered similarity heatmap and Cluster's
 * cluster-sorted and cross-signal-agreement heatmaps. Those pages differ
 * only in what matrix, order, color scale, and tooltip text they supply.
 */
export class MatrixHeatmap {
  private readonly container: HTMLElement;
  private readonly psalmNumbers: readonly number[];
  private readonly matrix: readonly (readonly number[])[];
  private readonly order: readonly number[];
  private readonly orderIndices: readonly number[];
  private readonly colorScale: (value: number) => string;
  private readonly boundaries: readonly number[];
  private readonly diagonalColor: string;
  private readonly tooltipFor: (info: MatrixHeatmapHoverInfo) => string;
  private readonly onSelect: (psalm: number) => void;
  private readonly onHover?: (info: MatrixHeatmapHoverInfo | null) => void;

  private readonly base: HTMLCanvasElement;
  private readonly overlay: HTMLCanvasElement;
  private readonly tooltip: HTMLDivElement;

  private size = 0;
  private cellSize = 0;
  private selected: number | null = null;
  private readonly resizeObserver: ResizeObserver;

  constructor(options: MatrixHeatmapOptions) {
    this.container = options.container;
    this.psalmNumbers = options.psalmNumbers;
    this.matrix = options.matrix;
    this.order = options.displayOrder ?? options.psalmNumbers;
    const indexOfPsalm = new Map(this.psalmNumbers.map((psalm, index) => [psalm, index]));
    this.orderIndices = this.order.map((psalm) => {
      const index = indexOfPsalm.get(psalm);
      if (index === undefined) {
        throw new RangeError(`MatrixHeatmap: displayOrder references unknown psalm ${psalm}`);
      }
      return index;
    });
    this.colorScale = options.colorScale;
    this.boundaries = options.boundaries ?? [];
    this.diagonalColor = options.diagonalColor ?? DEFAULT_DIAGONAL_COLOR;
    this.tooltipFor = options.tooltipFor;
    this.onSelect = options.onSelect;
    this.onHover = options.onHover;

    this.container.innerHTML = "";
    this.base = document.createElement("canvas");
    this.overlay = document.createElement("canvas");
    this.tooltip = document.createElement("div");
    this.tooltip.className = "heatmap-tooltip";
    this.tooltip.hidden = true;
    this.container.append(this.base, this.overlay, this.tooltip);

    this.overlay.addEventListener("mousemove", this.handleMouseMove);
    this.overlay.addEventListener("mouseleave", this.handleMouseLeave);
    this.overlay.addEventListener("click", this.handleClick);

    this.resizeObserver = new ResizeObserver(() => this.resize());
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
  }

  private valueAt(displayRow: number, displayCol: number): number {
    return this.matrix[this.orderIndices[displayRow]][this.orderIndices[displayCol]];
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.size = Math.max(rect.width, 1);
    this.cellSize = this.size / this.order.length;
    const dpr = window.devicePixelRatio || 1;

    for (const canvas of [this.base, this.overlay]) {
      canvas.width = this.size * dpr;
      canvas.height = this.size * dpr;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        ctx.fillStyle = row === col ? this.diagonalColor : this.colorScale(this.valueAt(row, col));
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
        ctx.strokeStyle = "rgba(31, 42, 48, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, row * c, this.size, c);
        ctx.strokeRect(row * c, 0, c, this.size);
      }
    }

    if (hover) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hover.col * c, 0, c, this.size);
      ctx.strokeRect(0, hover.row * c, this.size, c);
    }
  }

  private cellAt(event: MouseEvent): { row: number; col: number } | null {
    const rect = this.overlay.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const n = this.order.length;
    const col = Math.min(n - 1, Math.max(0, Math.floor(x / this.cellSize)));
    const row = Math.min(n - 1, Math.max(0, Math.floor(y / this.cellSize)));
    return { row, col };
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    const cell = this.cellAt(event);
    if (!cell) return;
    this.drawOverlay(cell);

    const rowPsalm = this.order[cell.row];
    const colPsalm = this.order[cell.col];
    const value = this.valueAt(cell.row, cell.col);
    const info: MatrixHeatmapHoverInfo = { rowPsalm, colPsalm, value };

    this.tooltip.hidden = false;
    this.tooltip.style.left = `${event.clientX - this.container.getBoundingClientRect().left}px`;
    this.tooltip.style.top = `${event.clientY - this.container.getBoundingClientRect().top}px`;
    this.tooltip.innerHTML = this.tooltipFor(info);

    this.onHover?.(info);
  };

  private readonly handleMouseLeave = (): void => {
    this.tooltip.hidden = true;
    this.drawOverlay(null);
    this.onHover?.(null);
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const cell = this.cellAt(event);
    if (!cell) return;
    this.onSelect(this.order[cell.row]);
  };
}
