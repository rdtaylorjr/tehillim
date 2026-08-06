import type { ClusterMethodPayload, PsalmCore } from "../types";

export interface Point {
  psalm: number;
  x: number;
  y: number;
  cluster: number;
}

/** One point per psalm, positioned by this signal's own 2D similarity
 * embedding (see pipeline/embedding.py) and labeled with the cluster this
 * signal actually assigned it to. */
export function buildPoints(psalms: PsalmCore[], method: ClusterMethodPayload): Point[] {
  return psalms.map((psalm, index) => ({
    psalm: psalm.number,
    x: method.embedding.x[index] ?? 0,
    y: method.embedding.y[index] ?? 0,
    cluster: method.assignments[String(psalm.number)] ?? -1,
  }));
}

/** The cluster of the selected psalm, or null if nothing is selected or
 * the selected psalm isn't in this signal's point set. */
export function selectedCluster(
  pointByPsalm: ReadonlyMap<number, Point>,
  selected: number | null,
): number | null {
  if (selected === null) return null;
  return pointByPsalm.get(selected)?.cluster ?? null;
}

/** Whether `point` should read as de-emphasized: true for every point
 * outside the selected point's own cluster, once a cluster is actually
 * selected. The selected point itself is never dimmed. */
export function isPointDimmed(
  point: Point,
  selected: number | null,
  selectedClusterId: number | null,
): boolean {
  return selectedClusterId !== null && point.cluster !== selectedClusterId && point.psalm !== selected;
}

/** Same de-emphasis rule as `isPointDimmed`, for a cluster's hull. */
export function isHullDimmed(cluster: number, selectedClusterId: number | null): boolean {
  return selectedClusterId !== null && cluster !== selectedClusterId;
}

/** Whether a click at `target` should clear the selection - true only for
 * a genuine background click (the plot's own root element), not a click
 * that landed on a point (hulls are pointer-events: none in CSS so they
 * never intercept a click either). */
export function isBackgroundClick(target: EventTarget | null, background: EventTarget | null): boolean {
  return target === background;
}
