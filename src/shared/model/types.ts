/** Mirrors the JSON payload written by pipeline/src/tehillim/export.py */

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

/** Mirrors the payload written by pipeline/src/tehillim/export_clustering.py. */

export interface ClusterInfo {
  index: number;
  size: number;
  psalmNumbers: number[];
}

/** Cross-tab of this clustering against Gunkel's genre classification. */
export interface GenreAlignment {
  genres: string[];
  /** counts[genreIndex][clusterIndex] */
  counts: number[][];
  /** counts[genreIndex] summed */
  genreTotals: number[];
  /** Best-matching genre per cluster by Hungarian assignment, or null where none. */
  clusterGenreLabels: (string | null)[];
  /** Largest single-genre count per cluster, summed over indexed psalms. */
  purity: number;
  /** Adjusted Mutual Information against Gunkel genre, corrected for chance. */
  ami: number;
  /** Adjusted Rand Index: pairwise agreement, corrected for chance. */
  ari: number;
  /** Raw permutation p-value for `ami`, uncorrected across signals. */
  amiPValue: number;
  /** `amiPValue` after Benjamini-Hochberg correction across every shipped signal. */
  amiPValueAdjusted: number;
}

/** Laplacian eigenmap layout, one x/y per psalm, in the eigenspace the clustering uses. */
export interface Embedding2D {
  x: number[];
  y: number[];
  /** Fraction of cluster-relevant spectral structure these two dimensions capture. */
  structureCaptured?: number;
  /** The pre-rename name for `structureCaptured`, still present in older payloads. */
  varianceExplained?: number;
}

export interface ClusterMethodPayload {
  id: string;
  description: string;
  nClusters: number;
  /** Permutation p-value for the winning k-partition, or null where k was not chosen from data. */
  partitionPValue?: number | null;
  /** Fraction of subsamples whose silhouette sweep agreed with this exact k. */
  kStability?: number | null;
  assignments: Record<string, number>;
  clusters: ClusterInfo[];
  embedding: Embedding2D;
  /** Cross-tab against Gunkel's 14-genre decomposition. */
  genreAlignment: GenreAlignment;
  /** Cross-tab against Gunkel's six top-level families, coarser than `genreAlignment`. */
  familyAlignment: GenreAlignment;
}

export interface ClusteringPayload {
  generatedAt: string;
  corpus: { name: string; version: string };
  psalms: PsalmCore[];
  clusterMethods: ClusterMethodPayload[];
  defaultClusterMethod: string;
}

/** Mirrors the payload written by pipeline/src/tehillim/export_gunkel.py. */
export interface GunkelPsalmEntry {
  number: number;
  genre: string | null;
  family: string | null;
}

export interface GunkelPayload {
  generatedAt: string;
  genres: string[];
  families: string[];
  psalms: GunkelPsalmEntry[];
}
