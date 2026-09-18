import { loadDomainData, loadSlice } from "./loadDomainData";
import type { DomainLoad, Fetcher } from "./loadDomainData";
import type { LoadedSlice } from "../lib/results";
import type { FamilyId } from "../lib/corpus";

/** Remembers each family's outcome, so moving between families does not refetch megabytes. */
export function createDomainCache(
  fetcher?: Fetcher,
): (family: FamilyId) => Promise<DomainLoad> {
  const inFlight = new Map<FamilyId, Promise<DomainLoad>>();
  return (family) => {
    const cached = inFlight.get(family);
    if (cached) return cached;
    const pending = loadDomainData(family, fetcher).then((result) => {
      // A failure is worth retrying, while a loaded or absent family will not change.
      if (result.status === "failed") inFlight.delete(family);
      return result;
    });
    inFlight.set(family, pending);
    return pending;
  };
}

export type SliceLoader = (
  family: FamilyId,
  table: LoadedSlice["table"],
  name: string,
) => Promise<LoadedSlice["rows"]>;

/** The same remembering, for the sliced tables a drill-down needs. */
export function createSliceCache(fetcher?: Fetcher): SliceLoader {
  const inFlight = new Map<string, Promise<LoadedSlice["rows"]>>();
  return (family, table, name) => {
    const key = `${family}/${name}`;
    const cached = inFlight.get(key);
    if (cached) return cached;
    const pending = loadSlice(family, table, name, fetcher);
    inFlight.set(key, pending);
    return pending;
  };
}
