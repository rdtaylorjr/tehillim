import type { SimilarityPayload } from "../types";

export class DataLoadError extends Error {}

/** Fetch and validate the similarity payload. `fetcher` is injectable for testing. */
export async function loadSimilarityData(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<SimilarityPayload> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new DataLoadError(
      `Failed to load similarity data: ${response.status} ${response.statusText}`,
    );
  }
  const payload = (await response.json()) as SimilarityPayload;
  validatePayload(payload);
  return payload;
}

function validatePayload(
  payload: SimilarityPayload,
): asserts payload is SimilarityPayload {
  if (!payload || !Array.isArray(payload.psalms) || !Array.isArray(payload.matrix)) {
    throw new DataLoadError(
      "Malformed similarity payload: missing psalms or matrix",
    );
  }
  if (payload.matrix.length !== payload.psalms.length) {
    throw new DataLoadError(
      "Malformed similarity payload: matrix/psalms size mismatch",
    );
  }
}
