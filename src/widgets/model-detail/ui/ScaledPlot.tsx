import { useCallback, useEffect, useRef } from "react";
import * as Plotly from "plotly.js-dist-min";
import styles from "./ModelDetail.module.css";
import { fitScale } from "../lib/fitScale";

export type ObserverFactory = (callback: () => void) => {
  observe: (target: Element) => void;
  disconnect: () => void;
};

const defaultObserver: ObserverFactory = (callback) => new ResizeObserver(callback);

/** Matches PlotMount, so every chart on the page settles at the same moment. */
const SETTLE_MS = 120;

export interface ScaledPlotProps {
  readonly draw: (mount: HTMLElement) => void;
  /** Injected in tests so teardown is observable without a real Plotly graph. */
  readonly purge?: (mount: HTMLElement) => void;
  /** Injected in tests, since jsdom reports every width as zero. */
  readonly createObserver?: ObserverFactory;
}

/** Shrinks a fixed-pixel Plotly chart to the width available, scaling only the box. */
export function ScaledPlot({
  draw,
  purge,
  createObserver = defaultObserver,
}: ScaledPlotProps): React.ReactElement {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (box === null || inner === null) return;
    const plot = inner.firstElementChild;
    if (!(plot instanceof HTMLElement)) return;
    const scale = fitScale(plot.offsetWidth, box.clientWidth);
    inner.style.transform = scale === 1 ? "" : `scale(${String(scale)})`;
    // The transform leaves the original height behind, so the box is told what the chart now needs.
    box.style.height = `${String(Math.round(plot.offsetHeight * scale))}px`;
  }, []);

  useEffect(() => {
    const inner = innerRef.current;
    if (inner === null) return;
    draw(inner);
    measure();
    //: One measurement once the drag settles, since re-measuring every event thrashes.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = createObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, SETTLE_MS);
    });
    if (boxRef.current !== null) observer.observe(boxRef.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      if (purge === undefined) Plotly.purge(inner);
      else purge(inner);
    };
  }, [draw, purge, createObserver, measure]);

  return (
    <div className={styles.scaledBox} ref={boxRef}>
      <div className={styles.scaledInner} data-scaled ref={innerRef} />
    </div>
  );
}
