import { useCallback, useEffect, useMemo, useRef } from "react";
import styles from "./Heatmap.module.css";
import { PlotMount } from "../../../shared/ui";
import { mountSimilarityMatrix } from "./similarityMatrix";
import { bookBoundaries } from "../../../shared/lib/corpus";
import { percentileOffDiagonal } from "../../../shared/lib/results";
import type { PlotApi } from "../../../shared/charts";
import type { MethodPayload } from "../../../shared/model";

//: Scores are right-skewed, so a percentile spends the range where the data sits.
const COLOR_DOMAIN_PERCENTILE = 95;

export interface HeatmapProps {
  readonly method: MethodPayload;
  readonly onSelect: (psalm: number) => void;
  /** Injected in tests so the matrix renders without a real Plotly canvas. */
  readonly api?: PlotApi;
}

/** Book-ordered NxN psalm matrix, a click anywhere in it selecting that row's psalm. */
export function Heatmap({ method, onSelect, api }: HeatmapProps): React.ReactElement {
  //: Read through a ref, so a new handler never redraws 22,500 cells.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const domainMax = useMemo(
    () => Math.max(percentileOffDiagonal(method.matrix, COLOR_DOMAIN_PERCENTILE), 0.01),
    [method],
  );

  const draw = useCallback(
    (mount: HTMLElement) => {
      void mountSimilarityMatrix(
        mount,
        {
          method,
          domainMax,
          boundaries: bookBoundaries(),
          onSelect: (psalm) => {
            onSelectRef.current(psalm);
          },
        },
        api,
      );
    },
    [method, domainMax, api],
  );

  return <PlotMount draw={draw} className={styles.matrixMount} />;
}
