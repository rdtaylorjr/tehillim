/** Mirrors the compare files written by tehillim_compare.ui_export. */

/** Psalm facts that don't depend on the comparison method. */
export interface PsalmCore {
  number: number;
  verseCount: number;
  wordCount: number;
  incipit: string;
}

export interface SimilarEntry {
  psalm: number;
  score: number;
}

/** One method's identity in the compare index, mirroring tehillim_compare.ui_export. */
export interface CompareMethodMeta {
  id: string;
  description: string;
  /** The representation domain: lexical, morphological, syntactic, or semantic. */
  domain: string;
  /** The benchmark's identifier for the representation. */
  representation: string;
  modelBase: string;
  textVariant: string | null;
  aggregation: string;
  correction: string | null;
}

/** The compare index the page loads first: every method by identity, no matrices. */
export interface CompareIndex {
  generatedAt: string;
  corpus: { name: string; version: string };
  psalms: PsalmCore[];
  methods: CompareMethodMeta[];
  defaultMethod: string;
}

/** One method's matrix file, fetched when the method is chosen. */
export interface CompareMethodData {
  id: string;
  psalmNumbers: number[];
  similar: Record<string, SimilarEntry[]>;
  matrix: number[][];
}

/** A chosen method's identity and matrix together, the shape every compare view reads. */
export interface MethodPayload extends CompareMethodData {
  description: string;
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
