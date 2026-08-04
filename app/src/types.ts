/** Mirrors the JSON payload written by pipeline/src/tehillim_pipeline/export.py */

export interface FeatureScore {
  label: string;
  description: string;
  category: string;
  score: number;
}

/** Psalm facts that don't depend on the comparison method. */
export interface PsalmCore {
  number: number;
  verseCount: number;
  wordCount: number;
  incipit: string;
}

/** Per-method, per-psalm stats (what counts as a "term" varies by method). */
export interface MethodPsalmStats {
  number: number;
  termCount: number;
  uniqueTermCount: number;
  topTerms: FeatureScore[];
}

export interface SimilarEntry {
  psalm: number;
  score: number;
  sharedTerms: FeatureScore[];
}

export interface MethodPayload {
  id: string;
  description: string;
  psalmNumbers: number[];
  psalmStats: MethodPsalmStats[];
  similar: Record<string, SimilarEntry[]>;
  matrix: number[][];
}

export interface SimilarityPayload {
  generatedAt: string;
  corpus: { name: string; version: string };
  psalms: PsalmCore[];
  methods: MethodPayload[];
  defaultMethod: string;
}
