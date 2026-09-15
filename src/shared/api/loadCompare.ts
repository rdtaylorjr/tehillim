import { DataLoadError } from "./loadPayloads";
import type { CompareIndex, CompareMethodData } from "../model/types";

/** The index ships with the site, the matrices come from storage like the detail payloads. */
export const COMPARE_INDEX_URL = `${import.meta.env.BASE_URL}data/compare.json`;

/** Where one method's matrix is served from: a detail file, from storage, versioned in the query. */
export function compareMethodUrl(methodId: string): string {
  return `${import.meta.env.BASE_URL}data/detail_compare_${methodId}.json?v=${__DETAIL_VERSION__}`;
}

export type CompareMethodLoad =
  | { readonly status: "loaded"; readonly data: CompareMethodData }
  | { readonly status: "absent" }
  | { readonly status: "failed" };

export type CompareMethodLoader = (methodId: string) => Promise<CompareMethodLoad>;

/** Fetches and validates the compare index, `fetcher` injectable for tests. */
export async function loadCompareIndex(
  url: string = COMPARE_INDEX_URL,
  fetcher: typeof fetch = fetch,
): Promise<CompareIndex> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new DataLoadError(
      `Failed to load compare data: ${String(response.status)} ${response.statusText}`,
    );
  }
  const index = (await response.json()) as CompareIndex;
  validateCompareIndex(index);
  return index;
}

function validateCompareIndex(index: CompareIndex): void {
  if (!Array.isArray(index.psalms) || !Array.isArray(index.methods)) {
    throw new DataLoadError("Malformed compare index: missing psalms or methods");
  }
  if (index.methods.length === 0) {
    throw new DataLoadError("Malformed compare index: methods is empty");
  }
  if (!index.methods.some((m) => m.id === index.defaultMethod)) {
    throw new DataLoadError(
      `Malformed compare index: defaultMethod "${index.defaultMethod}" matches no method`,
    );
  }
}

function validateMethodData(data: CompareMethodData): void {
  if (!Array.isArray(data.matrix) || data.matrix.length !== data.psalmNumbers.length) {
    throw new DataLoadError(
      `Malformed compare method "${data.id}": matrix/psalms size mismatch`,
    );
  }
}

/** Caches by URL, since a method's export never changes, and drops failures so they retry. */
export function createCompareMethodLoader(fetcher: typeof fetch = fetch): CompareMethodLoader {
  const cache = new Map<string, Promise<CompareMethodLoad>>();

  return (methodId) => {
    const url = compareMethodUrl(methodId);
    const hit = cache.get(url);
    if (hit !== undefined) return hit;

    const pending = fetcher(url)
      .then(async (response): Promise<CompareMethodLoad> => {
        if (response.status === 404) return { status: "absent" };
        if (!response.ok) return { status: "failed" };
        const data = (await response.json()) as CompareMethodData;
        validateMethodData(data);
        return { status: "loaded", data };
      })
      .catch((): CompareMethodLoad => ({ status: "failed" }));

    cache.set(url, pending);
    void pending.then((result) => {
      if (result.status !== "loaded") cache.delete(url);
    });
    return pending;
  };
}
