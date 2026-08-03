import { createSimilarityColorScale } from "../lib/colorScale";
import { maxOffDiagonal } from "../lib/matrix";
import type { SimilarityPayload } from "../types";

export interface HeatmapHoverInfo {
  psalmA: number;
  psalmB: number;
  score: number;
}

export interface HeatmapOptions {
  container: HTMLElement;
  data: SimilarityPayload;
  onSelect: (psalm: number) => void;
  onHover?: (info: HeatmapHoverInfo | null) => void;
}

const BOOK_BOUNDARIES = [41, 72, 89, 106]; // last psalm number of books I-IV
const DIAGONAL_COLOR = "#0f1519";
const GRID_LINE_COLOR = "rgba(255, 255, 255, 0.4)";

/** Canvas-rendered 150x150 psalm similarity heatmap with hover/click interaction. */
export class Heatmap {
  private readonly container: HTMLElement;
  private readonly data: SimilarityPayload;
  private readonly onSelect: (psalm: number) => void;
  private readonly onHover?: (info: HeatmapHoverInfo | null) => void;

  private readonly base: HTMLCanvasElement;
  private readonly overlay: HTMLCanvasElement;
  private readonly tooltip: HTMLDivElement;
  private readonly colorScale: (value: number) => string;

  private size = 0;
  private cellSize = 0;
  private selected: number | null = null;
  private readonly resizeObserver: ResizeObserver;

  constructor(options: HeatmapOptions) {
    this.container = options.container;
    this.data = options.data;
    this.onSelect = options.onSelect;
    this.onHover = options.onHover;
    this.colorScale = createSimilarityColorScale(
      Math.max(maxOffDiagonal(this.data.matrix), 0.01),
    );

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

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.size = Math.max(rect.width, 1);
    this.cellSize = this.size / this.data.psalmNumbers.length;
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
    const n = this.data.psalmNumbers.length;
    const c = this.cellSize;

    ctx.clearRect(0, 0, this.size, this.size);
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        ctx.fillStyle =
          row === col ? DIAGONAL_COLOR : this.colorScale(this.data.matrix[row][col]);
        ctx.fillRect(col * c, row * c, Math.ceil(c) + 0.5, Math.ceil(c) + 0.5);
      }
    }

    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (const boundary of BOOK_BOUNDARIES) {
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
      const row = this.data.psalmNumbers.indexOf(this.selected);
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
    const n = this.data.psalmNumbers.length;
    const col = Math.min(n - 1, Math.max(0, Math.floor(x / this.cellSize)));
    const row = Math.min(n - 1, Math.max(0, Math.floor(y / this.cellSize)));
    return { row, col };
  }

  private readonly handleMouseMove = (event: MouseEvent): void => {
    const cell = this.cellAt(event);
    if (!cell) return;
    this.drawOverlay(cell);

    const psalmA = this.data.psalmNumbers[cell.row];
    const psalmB = this.data.psalmNumbers[cell.col];
    const score = this.data.matrix[cell.row][cell.col];

    this.tooltip.hidden = false;
    this.tooltip.style.left = `${event.clientX - this.container.getBoundingClientRect().left}px`;
    this.tooltip.style.top = `${event.clientY - this.container.getBoundingClientRect().top}px`;
    this.tooltip.innerHTML =
      psalmA === psalmB
        ? `Psalm ${psalmA}`
        : `Psalm ${psalmA} &harr; Psalm ${psalmB}<br><span class="tt-score">${score.toFixed(3)}</span> similarity`;

    this.onHover?.({ psalmA, psalmB, score });
  };

  private readonly handleMouseLeave = (): void => {
    this.tooltip.hidden = true;
    this.drawOverlay(null);
    this.onHover?.(null);
  };

  private readonly handleClick = (event: MouseEvent): void => {
    const cell = this.cellAt(event);
    if (!cell) return;
    this.onSelect(this.data.psalmNumbers[cell.row]);
  };
}
