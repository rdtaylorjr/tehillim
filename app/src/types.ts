/** Mirrors the JSON payload written by pipeline/src/tehillim_pipeline/export.py */

export interface LexemeScore {
  lemma: string;
  gloss: string;
  pos: string;
  score: number;
}

export interface PsalmSummary {
  number: number;
  verseCount: number;
  wordCount: number;
  contentWordCount: number;
  uniqueLexemeCount: number;
  incipit: string;
  topLexemes: LexemeScore[];
}

export interface SimilarEntry {
  psalm: number;
  score: number;
  sharedLexemes: LexemeScore[];
}

export interface SimilarityMeta {
  method: string;
  description: string;
  corpus: { name: string; version: string };
  generatedAt: string;
  psalmCount: number;
}

export interface SimilarityPayload {
  meta: SimilarityMeta;
  psalmNumbers: number[];
  psalms: PsalmSummary[];
  similar: Record<string, SimilarEntry[]>;
  matrix: number[][];
}
