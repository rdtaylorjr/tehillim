import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/** The full width the field wants before anything is asked to give way. */
const FIELD_WIDTH = 200;

export type ObserverFactory = (callback: () => void) => {
  observe: (target: Element) => void;
  disconnect: () => void;
};

const defaultObserver: ObserverFactory = (callback) => new ResizeObserver(callback);

export interface FitClassNames {
  /** The single-line path, whose overflow is what the measurement reads. */
  readonly crumbs: string;
  /** Applied to the row when the minor crumbs must give way. */
  readonly hideMinor: string;
}

/** True once the row cannot show the path, the filters and a full-width field at once. */
function isTight(row: HTMLElement, names: FitClassNames): boolean {
  const crumbs = row.querySelector(`.${names.crumbs}`);
  if (crumbs === null) return false;
  if (crumbs.scrollWidth > crumbs.clientWidth + 1) return true;
  if (row.scrollWidth > row.clientWidth + 1) return true;
  const field = row.querySelector("input[type=text]");
  return field !== null && field.getBoundingClientRect().width < FIELD_WIDTH - 0.5;
}

/**
 * Drops whole minor crumbs rather than truncating them. The class is set from a measurement
 * taken after layout, which no breakpoint can stand in for since it depends on the path's text.
 */
export function useMinorCrumbFit(
  pathKey: string,
  names: FitClassNames,
  createObserver: ObserverFactory = defaultObserver,
): React.RefObject<HTMLDivElement | null> {
  const rowRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (row === null) return;
    // Measured with the minors shown, so the answer never depends on the previous answer.
    row.classList.remove(names.hideMinor);
    if (isTight(row, names)) row.classList.add(names.hideMinor);
  }, [names]);

  useLayoutEffect(measure, [measure, pathKey]);

  useEffect(() => {
    const row = rowRef.current;
    if (row === null) return undefined;
    const observer = createObserver(measure);
    observer.observe(row);
    return () => {
      observer.disconnect();
    };
  }, [createObserver, measure]);

  return rowRef;
}
