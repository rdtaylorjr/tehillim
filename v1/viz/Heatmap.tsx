import { useEffect, useMemo, useRef } from "react";
import styles from "./Heatmap.module.css";
import { MatrixHeatmap } from "./matrixHeatmap";
import type { MatrixHeatmapHoverInfo } from "./matrixHeatmap";
import { bookBoundaries } from "../lib/books";
import { createSimilarityColorScale } from "../lib/colorScale";
import { percentileOffDiagonal } from "../lib/matrix";
import type { MethodPayload } from "../model/types";

//: Similarity scores are often heavily right-skewed (most pairs score low, a
//: handful score high) - domaining the color scale on the true maximum
//: compresses nearly the entire matrix into one indistinguishable shade, since
//: one outlier pair claims the top of the range. Domaining on a high percentile
//: instead spends the color range where the bulk of the data actually sits; the
//: rare pairs above it still read as maximally similar, which the scale's own
//: clamp already handles.
const COLOR_DOMAIN_PERCENTILE = 95;

function tooltipFor(info: MatrixHeatmapHoverInfo): string {
  const { rowPsalm, colPsalm, value } = info;
  return rowPsalm === colPsalm
    ? `Psalm ${String(rowPsalm)}`
    : `Psalm ${String(rowPsalm)} &harr; Psalm ${String(colPsalm)}<br><span class="${styles.ttScore}">${value.toFixed(3)}</span> similarity`;
}

export interface HeatmapProps {
  readonly method: MethodPayload;
  readonly selected: number | null;
  readonly onSelect: (psalm: number) => void;
}

/** Book-ordered 150x150 psalm similarity heatmap, with the legend that states
 * what its colors mean - the two share one scale and domain, so they can never
 * disagree. */
export function Heatmap({ method, selected, onSelect }: HeatmapProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<MatrixHeatmap | null>(null);
  // The click handler must not remount the canvas, so the live one is read
  // through a ref rather than captured in the mount effect's dependencies.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const { colorScale, domainMax } = useMemo(() => {
    const max = Math.max(percentileOffDiagonal(method.matrix, COLOR_DOMAIN_PERCENTILE), 0.01);
    return { colorScale: createSimilarityColorScale(max), domainMax: max };
  }, [method]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const plot = new MatrixHeatmap(
      {
        container,
        psalmNumbers: method.psalmNumbers,
        matrix: method.matrix,
        colorScale,
        boundaries: bookBoundaries(),
        tooltipFor,
        onSelect: (psalm) => {
          onSelectRef.current(psalm);
        },
      },
      { tooltip: styles.heatmapTooltip },
    );
    plotRef.current = plot;
    return () => {
      plot.destroy();
      plotRef.current = null;
    };
  }, [colorScale, method]);

  useEffect(() => {
    plotRef.current?.setSelected(selected);
  }, [selected]);

  const steps = 24;

  return (
    <>
      <div className={styles.heatmapContainer} ref={containerRef} />
      <div className={styles.heatmapLegend}>
        <span className={styles.heatmapLegendLabel}>0</span>
        <span className={styles.heatmapLegendBar}>
          {Array.from({ length: steps + 1 }, (_, i) => (i / steps) * domainMax).map((stop) => (
            <span key={stop} style={{ background: colorScale(stop) }} />
          ))}
        </span>
        <span className={styles.heatmapLegendLabel}>&ge;{domainMax.toFixed(2)}</span>
        <span>similarity</span>
      </div>
    </>
  );
}
