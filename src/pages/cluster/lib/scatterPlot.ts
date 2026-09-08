import type { ClusterMethodPayload, PsalmCore } from "../../../shared/model";

export interface Point {
  psalm: number;
  x: number;
  y: number;
  cluster: number;
}

/** One point per psalm, positioned by this signal's 2D embedding. */
export function buildPoints(psalms: PsalmCore[], method: ClusterMethodPayload): Point[] {
  return psalms.map((psalm, index) => ({
    psalm: psalm.number,
    x: method.embedding.x[index] ?? 0,
    y: method.embedding.y[index] ?? 0,
    cluster: method.assignments[String(psalm.number)] ?? -1,
  }));
}

/** The selected psalm's cluster, or null where there is none. */
export function selectedCluster(
  pointByPsalm: ReadonlyMap<number, Point>,
  selected: number | null,
): number | null {
  if (selected === null) return null;
  return pointByPsalm.get(selected)?.cluster ?? null;
}

/** True for a point outside the selected cluster, never for the selection. */
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

/** The mean of a cluster's points, used where a hull needs an area that is zero. */
export function degenerateHullCentroid(points: readonly [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];
  const [sumX, sumY] = points.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0]);
  return [sumX / points.length, sumY / points.length];
}

/** True only for a click on the plot's root element, never on a point. */
export function isBackgroundClick(
  target: EventTarget | null,
  background: EventTarget | null,
): boolean {
  return target === background;
}
