import type { ClusteringPayload } from "../types";
import { DataLoadError } from "./loadSimilarityData";

export { DataLoadError };

/** Fetch and validate the clustering payload. `fetcher` is injectable for testing. */
export async function loadClusteringData(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<ClusteringPayload> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new DataLoadError(
      `Failed to load clustering data: ${response.status} ${response.statusText}`,
    );
  }
  const payload = (await response.json()) as ClusteringPayload;
  validatePayload(payload);
  return payload;
}

function validatePayload(
  payload: ClusteringPayload,
): asserts payload is ClusteringPayload {
  if (!payload || !Array.isArray(payload.psalms) || !Array.isArray(payload.clusterMethods)) {
    throw new DataLoadError(
      "Malformed clustering payload: missing psalms or clusterMethods",
    );
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
