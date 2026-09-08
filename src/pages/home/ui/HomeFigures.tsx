import { useEffect, useRef } from "react";
import styles from "./HomeFigures.module.css";
import { MatrixHeatmap } from "../../../shared/ui/matrixHeatmap";
import { AlluvialDiagram } from "../../../shared/ui/AlluvialDiagram";
import { ResultsTable, parallelismOverallColumns } from "../../../widgets/benchmark-table";
import {
  createGunkelFamilyColorScale,
  createSimilarityColorScale,
} from "../../../shared/lib/color";
import { bookBoundaries } from "../../../shared/lib/corpus";
import type { HomeFigures } from "../api/loadHomeFigures";

/** Complete rows the card shows. The payload carries more, so the table is cut. */
const ROWS_SHOWN = 8;

/** How far the table is stepped down. The card's height follows from it. */
const FIT = 0.73;

export function BenchmarkFigure({
  figures,
}: {
  readonly figures: HomeFigures;
}): React.ReactElement {
  const boxRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  //: Only the width is imposed. The height is read back from the last row's edge.
  useEffect(() => {
    const box = boxRef.current;
    const scale = scaleRef.current;
    if (box === null || scale === null) return;
    const rows = scale.querySelectorAll<HTMLTableRowElement>("tbody tr");
    const lastShown = rows[ROWS_SHOWN - 1];
    if (lastShown === undefined) return;

    const boxWidth = box.clientWidth;
    if (boxWidth === 0) return;

    const width = boxWidth / FIT;
    scale.style.width = `${String(width)}px`;
    scale.style.height = `${String(width)}px`;
    scale.style.setProperty("--fit", String(FIT));

    const boundary = lastShown.getBoundingClientRect().bottom - box.getBoundingClientRect().top;
    if (boundary <= 0) return;
    box.closest("ul")?.style.setProperty("--figure-h", `${String(Math.round(boundary))}px`);
  }, [figures]);

  return (
    <div className={styles.figure} ref={boxRef} aria-hidden="true">
      <div className={styles.tableScale} ref={scaleRef}>
        <ResultsTable
          caption="The top of the parallelism ranking"
          rows={figures.benchmark.rows}
          columns={parallelismOverallColumns().slice(0, 3)}
          sortKey="separation_auc"
          sortDir="desc"
          onSort={() => undefined}
          onOpenModel={() => undefined}
        />
      </div>
    </div>
  );
}

/** The similarity matrix, drawn by the canvas renderer the compare page uses. */
export function CompareFigure({
  figures,
}: {
  readonly figures: HomeFigures;
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return undefined;
    const { matrix, psalms, domainMax } = figures.compare;
    const plot = new MatrixHeatmap(
      {
        container,
        psalmNumbers: psalms,
        matrix,
        boundaries: bookBoundaries(),
        colorScale: createSimilarityColorScale(Math.max(domainMax, 0.01)),
        tooltipFor: () => "",
        onSelect: () => undefined,
      },
      { tooltip: styles.figureTooltip },
    );
    return () => {
      plot.destroy();
    };
  }, [figures]);

  return (
    <div className={styles.figure} aria-hidden="true">
      <div className={styles.square} ref={containerRef} />
    </div>
  );
}

/** The genre-to-cluster flow, drawn by the cluster page's alluvial. */
export function ClusterFigure({
  figures,
}: {
  readonly figures: HomeFigures;
}): React.ReactElement {
  const { alignment } = figures.cluster;
  const genreColorOf = createGunkelFamilyColorScale(alignment.genres);
  return (
    <div className={styles.figure} aria-hidden="true">
      <AlluvialDiagram
        alignment={alignment}
        genreColorOf={genreColorOf}
        selected={null}
        compact
      />
    </div>
  );
}
