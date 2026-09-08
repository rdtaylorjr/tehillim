//: Canonical name per signal, keyed by base id, shared by Compare and Cluster.
const FEATURE_NAMES: Record<string, string> = {
  lexical: "Lexical",
  root: "Lexical (Root)",
  "named-entity-identity": "Lexical (Named Entities)",
  "verb-morphology": "Syntactic (Verb Morphology)",
  "person-profile": "Syntactic (Person)",
  "lexical-set": "Syntactic (Lexical Set)",
  "named-entity": "Syntactic (Named Entity Type)",
  "clause-type": "Syntactic (Clause Type)",
  "text-type": "Syntactic (Text Type)",
  "clause-relation": "Syntactic (Clause Relation)",
  "verb-sense": "Syntactic (Verb Sense)",
  "miqrabert-mean-pool": "Semantic (MiqraBERT, Mean-Pool)",
  "miqrabert-soft-alignment": "Semantic (MiqraBERT, Soft-Alignment)",
  "alephbert-mean-pool": "Semantic (AlephBERT, Mean-Pool)",
  "alephbert-soft-alignment": "Semantic (AlephBERT, Soft-Alignment)",
  "alephbert-soft-alignment-top-pc": "Semantic (AlephBERT, Soft-Alignment, Top-PC Removed)",
  "alephbert-soft-alignment-whitened": "Semantic (AlephBERT, Soft-Alignment, Whitened)",
  "berel-mean-pool": "Semantic (BEREL, Mean-Pool)",
  "berel-soft-alignment": "Semantic (BEREL, Soft-Alignment)",
  "berel-soft-alignment-top-pc": "Semantic (BEREL, Soft-Alignment, Top-PC Removed)",
  "berel-soft-alignment-whitened": "Semantic (BEREL, Soft-Alignment, Whitened)",
  "neodictabert-mean-pool": "Semantic (NeoDictaBERT, Mean-Pool)",
  "neodictabert-soft-alignment": "Semantic (NeoDictaBERT, Soft-Alignment)",
  "neodictabert-soft-alignment-top-pc":
    "Semantic (NeoDictaBERT, Soft-Alignment, Top-PC Removed)",
  "neodictabert-soft-alignment-whitened": "Semantic (NeoDictaBERT, Soft-Alignment, Whitened)",
  "bge-multilingual-gemma2-mean-pool":
    "Semantic (BGE-Multilingual-Gemma2, Mean-Pool, Cantillation)",
  "bge-multilingual-gemma2-mean-pool-consonantal":
    "Semantic (BGE-Multilingual-Gemma2, Mean-Pool, Consonantal)",
  "bge-multilingual-gemma2-mean-pool-vocalized":
    "Semantic (BGE-Multilingual-Gemma2, Mean-Pool, Vocalized)",
  "bge-multilingual-gemma2-soft-alignment":
    "Semantic (BGE-Multilingual-Gemma2, Soft-Alignment, Cantillation)",
  "bge-multilingual-gemma2-soft-alignment-consonantal":
    "Semantic (BGE-Multilingual-Gemma2, Soft-Alignment, Consonantal)",
  "bge-multilingual-gemma2-soft-alignment-vocalized":
    "Semantic (BGE-Multilingual-Gemma2, Soft-Alignment, Vocalized)",
  "qwen3-embedding-mean-pool": "Semantic (Qwen3-Embedding, Mean-Pool, Cantillation)",
  "qwen3-embedding-mean-pool-consonantal": "Semantic (Qwen3-Embedding, Mean-Pool, Consonantal)",
  "qwen3-embedding-mean-pool-vocalized": "Semantic (Qwen3-Embedding, Mean-Pool, Vocalized)",
  "qwen3-embedding-soft-alignment": "Semantic (Qwen3-Embedding, Soft-Alignment, Cantillation)",
  "qwen3-embedding-soft-alignment-consonantal":
    "Semantic (Qwen3-Embedding, Soft-Alignment, Consonantal)",
  "qwen3-embedding-soft-alignment-vocalized":
    "Semantic (Qwen3-Embedding, Soft-Alignment, Vocalized)",
  "kalm-embedding-mean-pool": "Semantic (KaLM-Embedding, Mean-Pool, Cantillation)",
  "kalm-embedding-mean-pool-consonantal": "Semantic (KaLM-Embedding, Mean-Pool, Consonantal)",
  "kalm-embedding-mean-pool-vocalized": "Semantic (KaLM-Embedding, Mean-Pool, Vocalized)",
  "kalm-embedding-soft-alignment": "Semantic (KaLM-Embedding, Soft-Alignment, Cantillation)",
  "kalm-embedding-soft-alignment-consonantal":
    "Semantic (KaLM-Embedding, Soft-Alignment, Consonantal)",
  "kalm-embedding-soft-alignment-vocalized":
    "Semantic (KaLM-Embedding, Soft-Alignment, Vocalized)",
  "llama-embed-nemotron-mean-pool":
    "Semantic (Llama-Embed-Nemotron-8B, Mean-Pool, Cantillation)",
  "llama-embed-nemotron-mean-pool-consonantal":
    "Semantic (Llama-Embed-Nemotron-8B, Mean-Pool, Consonantal)",
  "llama-embed-nemotron-mean-pool-vocalized":
    "Semantic (Llama-Embed-Nemotron-8B, Mean-Pool, Vocalized)",
  "llama-embed-nemotron-soft-alignment":
    "Semantic (Llama-Embed-Nemotron-8B, Soft-Alignment, Cantillation)",
  "llama-embed-nemotron-soft-alignment-consonantal":
    "Semantic (Llama-Embed-Nemotron-8B, Soft-Alignment, Consonantal)",
  "llama-embed-nemotron-soft-alignment-vocalized":
    "Semantic (Llama-Embed-Nemotron-8B, Soft-Alignment, Vocalized)",
  "gemini-mean-pool": "Semantic (Gemini, Mean-Pool, Cantillation)",
  "gemini-mean-pool-consonantal": "Semantic (Gemini, Mean-Pool, Consonantal)",
  "gemini-mean-pool-vocalized": "Semantic (Gemini, Mean-Pool, Vocalized)",
  "gemini-soft-alignment": "Semantic (Gemini, Soft-Alignment, Cantillation)",
  "gemini-soft-alignment-consonantal": "Semantic (Gemini, Soft-Alignment, Consonantal)",
  "gemini-soft-alignment-vocalized": "Semantic (Gemini, Soft-Alignment, Vocalized)",
  "openai-mean-pool": "Semantic (OpenAI, Mean-Pool, Cantillation)",
  "openai-mean-pool-consonantal": "Semantic (OpenAI, Mean-Pool, Consonantal)",
  "openai-mean-pool-vocalized": "Semantic (OpenAI, Mean-Pool, Vocalized)",
  "openai-soft-alignment": "Semantic (OpenAI, Soft-Alignment, Cantillation)",
  "openai-soft-alignment-consonantal": "Semantic (OpenAI, Soft-Alignment, Consonantal)",
  "openai-soft-alignment-vocalized": "Semantic (OpenAI, Soft-Alignment, Vocalized)",
  "cohere-mean-pool": "Semantic (Cohere, Mean-Pool, Cantillation)",
  "cohere-mean-pool-consonantal": "Semantic (Cohere, Mean-Pool, Consonantal)",
  "cohere-mean-pool-vocalized": "Semantic (Cohere, Mean-Pool, Vocalized)",
  "cohere-soft-alignment": "Semantic (Cohere, Soft-Alignment, Cantillation)",
  "cohere-soft-alignment-consonantal": "Semantic (Cohere, Soft-Alignment, Consonantal)",
  "cohere-soft-alignment-vocalized": "Semantic (Cohere, Soft-Alignment, Vocalized)",
  "voyage-mean-pool": "Semantic (Voyage 4, Mean-Pool, Cantillation)",
  "voyage-mean-pool-consonantal": "Semantic (Voyage 4, Mean-Pool, Consonantal)",
  "voyage-mean-pool-vocalized": "Semantic (Voyage 4, Mean-Pool, Vocalized)",
  "voyage-soft-alignment": "Semantic (Voyage 4, Soft-Alignment, Cantillation)",
  "voyage-soft-alignment-consonantal": "Semantic (Voyage 4, Soft-Alignment, Consonantal)",
  "voyage-soft-alignment-vocalized": "Semantic (Voyage 4, Soft-Alignment, Vocalized)",
  "bge-m3-mean-pool": "Semantic (BGE-M3, Mean-Pool, Cantillation)",
  "bge-m3-mean-pool-consonantal": "Semantic (BGE-M3, Mean-Pool, Consonantal)",
  "bge-m3-mean-pool-vocalized": "Semantic (BGE-M3, Mean-Pool, Vocalized)",
  "bge-m3-soft-alignment": "Semantic (BGE-M3, Soft-Alignment, Cantillation)",
  "bge-m3-soft-alignment-consonantal": "Semantic (BGE-M3, Soft-Alignment, Consonantal)",
  "bge-m3-soft-alignment-vocalized": "Semantic (BGE-M3, Soft-Alignment, Vocalized)",
  "gte-multilingual-base-mean-pool":
    "Semantic (GTE-Multilingual-Base, Mean-Pool, Cantillation)",
  "gte-multilingual-base-mean-pool-consonantal":
    "Semantic (GTE-Multilingual-Base, Mean-Pool, Consonantal)",
  "gte-multilingual-base-mean-pool-vocalized":
    "Semantic (GTE-Multilingual-Base, Mean-Pool, Vocalized)",
  "gte-multilingual-base-soft-alignment":
    "Semantic (GTE-Multilingual-Base, Soft-Alignment, Cantillation)",
  "gte-multilingual-base-soft-alignment-consonantal":
    "Semantic (GTE-Multilingual-Base, Soft-Alignment, Consonantal)",
  "gte-multilingual-base-soft-alignment-vocalized":
    "Semantic (GTE-Multilingual-Base, Soft-Alignment, Vocalized)",
  "me5-large-instruct-mean-pool": "Semantic (mE5-Large-Instruct, Mean-Pool, Cantillation)",
  "me5-large-instruct-mean-pool-consonantal":
    "Semantic (mE5-Large-Instruct, Mean-Pool, Consonantal)",
  "me5-large-instruct-mean-pool-vocalized":
    "Semantic (mE5-Large-Instruct, Mean-Pool, Vocalized)",
  "me5-large-instruct-soft-alignment":
    "Semantic (mE5-Large-Instruct, Soft-Alignment, Cantillation)",
  "me5-large-instruct-soft-alignment-consonantal":
    "Semantic (mE5-Large-Instruct, Soft-Alignment, Consonantal)",
  "me5-large-instruct-soft-alignment-vocalized":
    "Semantic (mE5-Large-Instruct, Soft-Alignment, Vocalized)",
};

//: A naming table, never a gate: an unlisted signal keeps its place in the picker.
const FEATURE_RANK = new Map(Object.keys(FEATURE_NAMES).map((id, index) => [id, index]));

/** Where a signal sits in the canonical order, or after everything named. */
export function featureRank(baseId: string): number {
  return FEATURE_RANK.get(baseFeatureId(baseId)) ?? Number.MAX_SAFE_INTEGER;
}

export interface FeatureDisplay {
  /** The leading word of the canonical name: "Lexical", "Syntactic", "Semantic". */
  readonly family: string;
  /** What the name says inside its parentheses, or null where it says nothing. */
  readonly detail: string | null;
  /** False where the id is not in the table, so the caller can name it itself. */
  readonly known: boolean;
}

/** The canonical name taken apart into its family and what distinguishes it. */
export function featureDisplay(baseId: string): FeatureDisplay {
  const id = baseFeatureId(baseId);
  const name = FEATURE_NAMES[id];
  if (name === undefined) return { family: "", detail: null, known: false };
  const match = /^([^(]+?)\s*\((.*)\)$/.exec(name);
  return match?.[1] !== undefined && match[2] !== undefined
    ? { family: match[1], detail: match[2], known: true }
    : { family: name, detail: null, known: true };
}

/** Strips a method id's page-specific suffix, leaving the shared signal id. */
export function baseFeatureId(methodId: string): string {
  return methodId.replace(/-tfidf-cosine$/, "").replace(/-spectral$/, "");
}

//: Falls back to the raw id for a method this table has not caught up with.
export function featureNameFromMethodId(methodId: string): string {
  return FEATURE_NAMES[baseFeatureId(methodId)] ?? methodId;
}

/** The canonical name as a slash path, each axis narrowing the one before it. */
export function featurePhrase(methodId: string): string {
  const display = featureDisplay(methodId);
  if (!display.known) return featureNameFromMethodId(methodId);
  if (display.detail === null) return display.family;
  return [display.family, ...display.detail.split(",").map((part) => part.trim())].join(" / ");
}

/** Maps a Cluster method id to the Compare id for the same signal. */
export function similarityIdForClusterMethodId(clusterMethodId: string): string {
  return `${baseFeatureId(clusterMethodId)}-tfidf-cosine`;
}
