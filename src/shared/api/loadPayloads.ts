import type { ClusteringPayload, GunkelPayload } from "../model/types";

export class DataLoadError extends Error {}

/** The reference payloads ship with the site. */
const BASE = import.meta.env.BASE_URL;
export const CLUSTERING_URL = `${BASE}data/clustering.json`;
export const GUNKEL_URL = `${BASE}data/gunkel.json`;

async function fetchJson<T>(url: string, what: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new DataLoadError(
      `Failed to load ${what} data: ${String(response.status)} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

/** Fetch and validate the clustering payload. `fetcher` is injectable for testing. */
export async function loadClusteringData(
  url: string = CLUSTERING_URL,
  fetcher: typeof fetch = fetch,
): Promise<ClusteringPayload> {
  const payload = await fetchJson<ClusteringPayload>(url, "clustering", fetcher);
  validateClustering(payload);
  return payload;
}

function validateClustering(payload: ClusteringPayload): void {
  if (!Array.isArray(payload.psalms) || !Array.isArray(payload.clusterMethods)) {
    throw new DataLoadError("Malformed clustering payload: missing psalms or clusterMethods");
  }
  if (payload.clusterMethods.length === 0) {
    throw new DataLoadError("Malformed clustering payload: clusterMethods is empty");
  }
  for (const method of payload.clusterMethods) {
    if (Object.keys(method.assignments).length !== payload.psalms.length) {
      throw new DataLoadError(
        `Malformed clustering payload: method "${method.id}" assignments/psalms size mismatch`,
      );
    }
  }
  if (!payload.clusterMethods.some((m) => m.id === payload.defaultClusterMethod)) {
    throw new DataLoadError(
      `Malformed clustering payload: defaultClusterMethod "${payload.defaultClusterMethod}" matches no method`,
    );
  }
}

/** Fetches and validates the shared Gunkel payload, `fetcher` injectable for tests. */
export async function loadGunkelData(
  url: string = GUNKEL_URL,
  fetcher: typeof fetch = fetch,
): Promise<GunkelPayload> {
  const payload = await fetchJson<GunkelPayload>(url, "Gunkel", fetcher);
  validateGunkel(payload);
  return payload;
}

function validateGunkel(payload: GunkelPayload): void {
  if (
    !Array.isArray(payload.genres) ||
    !Array.isArray(payload.families) ||
    !Array.isArray(payload.psalms)
  ) {
    throw new DataLoadError("Malformed Gunkel payload: missing genres, families, or psalms");
  }
  if (payload.psalms.length !== 150) {
    throw new DataLoadError(
      `Malformed Gunkel payload: expected 150 psalms, got ${String(payload.psalms.length)}`,
    );
  }
}
