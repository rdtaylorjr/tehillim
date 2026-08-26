import { loadDomainData, loadTrajectorySlice } from "./domainData";
import type { DomainLoad, Fetcher } from "./domainData";
import type { DomainData } from "../lib/results";
import type { FamilyId } from "../lib/catalog";

/** Remembers each family's outcome, so moving between families does not refetch megabytes. */
export function createDomainCache(
  fetcher?: Fetcher,
): (family: FamilyId) => Promise<DomainLoad> {
  const inFlight = new Map<FamilyId, Promise<DomainLoad>>();
  return (family) => {
    const cached = inFlight.get(family);
    if (cached) return cached;
    const pending = loadDomainData(family, fetcher).then((result) => {
      // A failure is worth retrying; a loaded or absent family will not change under us.
      if (result.status === "failed") inFlight.delete(family);
      return result;
    });
    inFlight.set(family, pending);
    return pending;
  };
}

export type TrajectorySliceLoader = (
  family: FamilyId,
  metric: string,
) => Promise<DomainData["trajectory_by_genre"]>;

/** The same remembering, for the per-metric slices a drill-down needs. */
export function createTrajectorySliceCache(fetcher?: Fetcher): TrajectorySliceLoader {
  const inFlight = new Map<string, Promise<DomainData["trajectory_by_genre"]>>();
  return (family, metric) => {
    const key = `${family}/${metric}`;
    const cached = inFlight.get(key);
    if (cached) return cached;
    const pending = loadTrajectorySlice(family, metric, fetcher);
    inFlight.set(key, pending);
    return pending;
  };
}
