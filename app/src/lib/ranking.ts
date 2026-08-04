import type { MethodPayload, SimilarEntry } from "../types";

/** The precomputed, descending-ranked list of psalms most similar to `psalmNumber`. */
export function topMatches(
  method: MethodPayload,
  psalmNumber: number,
  limit = 12,
): SimilarEntry[] {
  const entries = method.similar[String(psalmNumber)] ?? [];
  return entries.slice(0, limit);
}
