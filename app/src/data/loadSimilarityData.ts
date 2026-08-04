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
  if (!payload || !Array.isArray(payload.psalms) || !Array.isArray(payload.methods)) {
    throw new DataLoadError(
      "Malformed similarity payload: missing psalms or methods",
    );
  }
  if (payload.methods.length === 0) {
    throw new DataLoadError("Malformed similarity payload: methods is empty");
  }
  for (const method of payload.methods) {
    if (method.matrix.length !== payload.psalms.length) {
      throw new DataLoadError(
        `Malformed similarity payload: method "${method.id}" matrix/psalms size mismatch`,
      );
    }
  }
  if (!payload.methods.some((m) => m.id === payload.defaultMethod)) {
    throw new DataLoadError(
      `Malformed similarity payload: defaultMethod "${payload.defaultMethod}" matches no method`,
    );
  }
}
