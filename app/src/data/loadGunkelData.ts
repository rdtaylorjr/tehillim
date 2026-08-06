import type { GunkelPayload } from "../types";
import { DataLoadError } from "./loadSimilarityData";

export { DataLoadError };

/** Fetch and validate the shared Gunkel reference payload. `fetcher` is
 * injectable for testing. */
export async function loadGunkelData(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<GunkelPayload> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new DataLoadError(`Failed to load Gunkel data: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as GunkelPayload;
  validatePayload(payload);
  return payload;
}

function validatePayload(payload: GunkelPayload): asserts payload is GunkelPayload {
  if (
    !payload ||
    !Array.isArray(payload.genres) ||
    !Array.isArray(payload.families) ||
    !Array.isArray(payload.psalms)
  ) {
    throw new DataLoadError("Malformed Gunkel payload: missing genres, families, or psalms");
  }
  if (payload.psalms.length !== 150) {
    throw new DataLoadError(
      `Malformed Gunkel payload: expected 150 psalms, got ${payload.psalms.length}`,
    );
  }
}
