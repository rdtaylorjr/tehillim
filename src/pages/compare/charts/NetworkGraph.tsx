import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./NetworkGraph.module.css";
import { PlotMount } from "../../../shared/ui";
import { mountNetwork } from "./network";
import type { NetworkPlot } from "./network";
import type { Point } from "../lib/layout";
import { percentileOffDiagonal } from "../../../shared/lib/results";
import type { ReferenceColoring } from "../../../shared/lib/color";
import type { PlotApi } from "../../../shared/charts";
import type { MethodPayload } from "../../../shared/model";

//: A percentile of each method's score distribution, since baselines differ widely.
const DEFAULT_THRESHOLD_PERCENTILE = 98;

export interface NetworkGraphProps {
  readonly method: MethodPayload;
  readonly coloring: ReferenceColoring;
  readonly selected: number | null;
  readonly onSelect: (psalm: number) => void;
  /** Injected in tests so the network renders without a real Plotly canvas. */
  readonly api?: PlotApi;
}

/** Force-laid network of psalms, drawn by Plotly and filled by the shared reference coloring. */
export function NetworkGraph({
  method,
  coloring,
  selected,
  onSelect,
  api,
}: NetworkGraphProps): React.ReactElement {
  const sliderId = useId();
  const plotRef = useRef<NetworkPlot | null>(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  //: Carried across redraws, so raising the threshold rearranges the edges rather than the graph.
  //: Tagged with the method it was laid out for, since a new representation earns a new layout.
  const positionsRef = useRef<{
    method: MethodPayload;
    points: ReadonlyMap<number, Point>;
  } | null>(null);

  const defaultThreshold = useMemo(
    () => percentileOffDiagonal(method.matrix, DEFAULT_THRESHOLD_PERCENTILE),
    [method],
  );
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [edgeCount, setEdgeCount] = useState(0);
  //: Adjusted during render, so the slider never paints the previous method's value.
  const [appliedDefault, setAppliedDefault] = useState(defaultThreshold);
  if (appliedDefault !== defaultThreshold) {
    setAppliedDefault(defaultThreshold);
    setThreshold(defaultThreshold);
  }

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    selectedRef.current = selected;
    plotRef.current?.setSelected(selected);
  }, [selected]);

  useEffect(() => {
    plotRef.current?.setColorOf(coloring.colorOf);
  }, [coloring]);

  const colorRef = useRef(coloring);
  useEffect(() => {
    colorRef.current = coloring;
  }, [coloring]);

  const draw = useCallback(
    (mount: HTMLElement) => {
      plotRef.current = null;
      void mountNetwork(
        mount,
        {
          method,
          threshold,
          colorOf: (psalm) => colorRef.current.colorOf(psalm),
          onSelect: (psalm) => {
            onSelectRef.current(psalm);
          },
          ...(positionsRef.current?.method === method
            ? { previous: positionsRef.current.points }
            : {}),
        },
        api,
      ).then((mounted) => {
        plotRef.current = mounted;
        positionsRef.current = { method, points: mounted.positions };
        setEdgeCount(mounted.edgeCount);
        //: The draw is asynchronous, so a selection made before it landed is applied here.
        mounted.setSelected(selectedRef.current);
      });
    },
    [method, threshold, api],
  );

  return (
    <>
      <div className={styles.networkControls}>
        <label htmlFor={sliderId}>Similarity threshold</label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(event) => {
            setThreshold(Number(event.target.value));
          }}
        />
        <output className={styles.thresholdValue} htmlFor={sliderId}>
          {threshold.toFixed(2)}
        </output>
        <span className={styles.edgeCount}>{edgeCount.toLocaleString()} connections shown</span>
      </div>
      <PlotMount draw={draw} className={styles.networkMount} />
    </>
  );
}
