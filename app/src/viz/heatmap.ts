import { bookBoundaries } from "../lib/books";
import { createSimilarityColorScale } from "../lib/colorScale";
import { percentileOffDiagonal } from "../lib/matrix";
import type { MethodPayload } from "../types";
import { MatrixHeatmap, type MatrixHeatmapHoverInfo } from "./matrixHeatmap";

export interface HeatmapHoverInfo {
  psalmA: number;
  psalmB: number;
  score: number;
}

export interface HeatmapOptions {
  container: HTMLElement;
  data: MethodPayload;
  onSelect: (psalm: number) => void;
  onHover?: (info: HeatmapHoverInfo | null) => void;
}

function tooltipFor(info: MatrixHeatmapHoverInfo): string {
  const { rowPsalm, colPsalm, value } = info;
  return rowPsalm === colPsalm
    ? `Psalm ${rowPsalm}`
    : `Psalm ${rowPsalm} &harr; Psalm ${colPsalm}<br><span class="tt-score">${value.toFixed(3)}</span> similarity`;
}

//: Similarity scores are often heavily right-skewed (most pairs score low,
//: a handful score high) - domaining the color scale on the true maximum
//: compresses nearly the entire matrix into one indistinguishable dark
//: shade, since one outlier pair claims the top of the range. Domaining on
//: a high percentile instead spends the color range on where the bulk of
//: the data actually sits; the (rare) pairs above it still read as
//: maximally similar, just without dragging everything else down to look
//: the same color scale.clamp(true) (see colorScale.ts) already handles.
const COLOR_DOMAIN_PERCENTILE = 95;

/** Book-ordered 150x150 psalm similarity heatmap - a thin Compare-page
 * wrapper around the generic `MatrixHeatmap` primitive. */
export class Heatmap {
  private readonly inner: MatrixHeatmap;
  /** Exposed so a caller can render a matching color legend (see
   * components/colorLegend.ts) - the heatmap and its legend must always
   * agree on what a color means, so they share this one scale + domain. */
  readonly colorScale: (value: number) => string;
  readonly colorDomainMax: number;

  constructor(options: HeatmapOptions) {
    const { data, onSelect, onHover } = options;
    this.colorDomainMax = Math.max(
      percentileOffDiagonal(data.matrix, COLOR_DOMAIN_PERCENTILE),
      0.01,
    );
    this.colorScale = createSimilarityColorScale(this.colorDomainMax);

    this.inner = new MatrixHeatmap({
      container: options.container,
      psalmNumbers: data.psalmNumbers,
      matrix: data.matrix,
      colorScale: this.colorScale,
      boundaries: bookBoundaries(),
      tooltipFor,
      onSelect,
      onHover: onHover
        ? (info) => onHover(info && { psalmA: info.rowPsalm, psalmB: info.colPsalm, score: info.value })
        : undefined,
    });
  }

  setSelected(psalm: number | null): void {
    this.inner.setSelected(psalm);
  }

  destroy(): void {
    this.inner.destroy();
  }
}
