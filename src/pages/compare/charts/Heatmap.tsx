import { useEffect, useMemo, useRef } from "react";
import styles from "./Heatmap.module.css";
import { MatrixHeatmap } from "../../../shared/ui/matrixHeatmap";
import type { MatrixHeatmapHoverInfo } from "../../../shared/ui/matrixHeatmap";
import { bookBoundaries } from "../../../shared/lib/corpus";
import { createSimilarityColorScale } from "../../../shared/lib/color";
import { percentileOffDiagonal } from "../../../shared/lib/results";
import type { MethodPayload } from "../../../shared/model";

//: Scores are right-skewed, so a percentile spends the range where the data sits.
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

/** Book-ordered 150x150 heatmap and its legend, sharing one scale and domain. */
export function Heatmap({ method, selected, onSelect }: HeatmapProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<MatrixHeatmap | null>(null);
  //: Read through a ref, so a new handler never remounts the canvas.
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
