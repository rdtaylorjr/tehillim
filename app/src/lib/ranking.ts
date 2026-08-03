import type { SimilarEntry, SimilarityPayload } from "../types";

/** The precomputed, descending-ranked list of psalms most similar to `psalmNumber`. */
export function topMatches(
  data: SimilarityPayload,
  psalmNumber: number,
  limit = 12,
): SimilarEntry[] {
  const entries = data.similar[String(psalmNumber)] ?? [];
  return entries.slice(0, limit);
}
