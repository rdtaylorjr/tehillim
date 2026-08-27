import { useEffect, useRef } from "react";
import * as Plotly from "plotly.js-dist-min";
import styles from "./ModelDetail.module.css";

/** Long enough that a drag settles before a redraw, short enough to feel immediate on release. */
const SETTLE_MS = 120;

export interface PlotMountProps {
  /** Draws one chart into the element; must be stable, or the plot is rebuilt every render. */
  readonly draw: (mount: HTMLElement) => void;
  /** Injected so a test can observe teardown without a real Plotly graph. */
  readonly purge?: (mount: HTMLElement) => void;
  /** Injected so a test can drive resizing without a real observer. */
  readonly resize?: (mount: HTMLElement) => void;
}

/** Owns the node Plotly draws into, redrawing once a resize settles rather than on every event. */
export function PlotMount({ draw, purge, resize }: PlotMountProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = ref.current;
    if (mount === null) return;
    draw(mount);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (resize === undefined) {
          Plotly.Plots.resize(mount);
          return;
        }
        resize(mount);
      }, SETTLE_MS);
    });
    observer.observe(mount);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      if (purge !== undefined) {
        purge(mount);
        return;
      }
      // Purging a node Plotly never drew into throws, so only a real plot is torn down.
      if ("_fullLayout" in mount) Plotly.purge(mount);
    };
  }, [draw, purge, resize]);

  return <div className={styles.chartMount} ref={ref} />;
}
