//: Canonical human-readable name for each underlying linguistic signal,
//: shared verbatim between the Compare page's method dropdown (pairwise
//: similarity per signal) and the Cluster page's method dropdown (spectral
//: clustering per signal) - the same signal must read identically on both
//: pages so a user can map between them. Keyed by the signal's base id
//: (the method id with its per-page suffix - "-tfidf-cosine" on Compare,
//: "-spectral" on Cluster - stripped off).
const FEATURE_NAMES: Record<string, string> = {
  lexical: "Lexical Similarity",
  root: "Lexical Similarity (Root)",
  "named-entity-identity": "Lexical Similarity (Named Entities)",
  "verb-morphology": "Syntactic Similarity (Verb Morphology)",
  "person-profile": "Syntactic Similarity (Person)",
  "lexical-set": "Syntactic Similarity (Lexical Set)",
  "named-entity": "Syntactic Similarity (Named Entity Type)",
  "clause-type": "Clause Structure (Clause Type)",
  "text-type": "Clause Structure (Text Type)",
  "clause-relation": "Clause Structure (Clause Relation)",
  "verb-sense": "Clause Structure (Verb Sense)",
  "alephbert-mean-pool": "Semantic Similarity (AlephBERT, Mean-Pool)",
  "alephbert-soft-alignment": "Semantic Similarity (AlephBERT, Soft-Alignment)",
  "miqrabert-mean-pool": "Semantic Similarity (MiqraBERT, Mean-Pool)",
  "miqrabert-soft-alignment": "Semantic Similarity (MiqraBERT, Soft-Alignment)",
};

/** Strips a method id's page-specific suffix, leaving the shared signal id. */
export function baseFeatureId(methodId: string): string {
  return methodId.replace(/-tfidf-cosine$/, "").replace(/-spectral$/, "");
}

//: Falls back to the raw id for any method added to the pipeline before
//: FEATURE_NAMES is updated, so a new method still shows up (just less
//: prettily) rather than breaking.
export function featureNameFromMethodId(methodId: string): string {
  return FEATURE_NAMES[baseFeatureId(methodId)] ?? methodId;
}

/** Maps a Cluster-page method id to the Compare-page similarity method id
 * for the same underlying signal (e.g. "verb-morphology-spectral" ->
 * "verb-morphology-tfidf-cosine"), so the Cluster page can look up that
 * signal's similarity matrix. */
export function similarityIdForClusterMethodId(clusterMethodId: string): string {
  return `${baseFeatureId(clusterMethodId)}-tfidf-cosine`;
}
