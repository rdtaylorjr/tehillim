import type { ClusterMethodPayload, PsalmCore } from "../model/types";

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
  return (
    selectedClusterId !== null &&
    point.cluster !== selectedClusterId &&
    point.psalm !== selected
  );
}

/** Same de-emphasis rule as `isPointDimmed`, for a cluster's hull. */
export function isHullDimmed(cluster: number, selectedClusterId: number | null): boolean {
  return selectedClusterId !== null && cluster !== selectedClusterId;
}

/** The centroid to label a cluster's hull marker at when no proper hull
 * exists - `d3.polygonHull` returns null for fewer than 3 points, and the
 * viz layer previously fell back to `d3.polygonCentroid` on a degenerate
 * (zero-area) polygon built from those same points, which divides by that
 * zero area and produces NaN. Measured directly against real data: every
 * anisotropy-corrected "whitened" signal (data-driven k in the 6-10
 * range) puts at least one cluster this small, so this isn't a
 * theoretical edge case. The simple mean of the cluster's own points
 * never divides by an area at all, so it can't produce NaN this way. */
export function degenerateHullCentroid(points: readonly [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  const [sumX, sumY] = points.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0]);
  return [sumX / points.length, sumY / points.length];
}

/** Whether a click at `target` should clear the selection - true only for
 * a genuine background click (the plot's own root element), not a click
 * that landed on a point (hulls are pointer-events: none in CSS so they
 * never intercept a click either). */
export function isBackgroundClick(
  target: EventTarget | null,
  background: EventTarget | null,
): boolean {
  return target === background;
}
