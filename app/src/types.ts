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

/** Mirrors the JSON payload written by
 * pipeline/src/tehillim_pipeline/export_clustering.py */

export interface ClusterInfo {
  index: number;
  size: number;
  psalmNumbers: number[];
}

/** Contingency table cross-tabulating this clustering against Gunkel's
 * psalm-by-psalm genre classification (see pipeline/genre_alignment.py). */
export interface GenreAlignment {
  genres: string[];
  /** counts[genreIndex][clusterIndex] */
  counts: number[][];
  /** counts[genreIndex] summed */
  genreTotals: number[];
  /** Best-matching genre per cluster index (optimal one-to-one assignment
   * maximizing total overlap - the Hungarian algorithm), or null where no
   * genre with nonzero overlap remained available for that cluster. */
  clusterGenreLabels: (string | null)[];
  /** Sum of each cluster's largest single-genre count, divided by indexed
   * psalm count - unlike clusterGenreLabels, clusters may share a
   * majority genre here. */
  purity: number;
  /** Adjusted Mutual Information between cluster assignment and Gunkel
   * genre, corrected for chance agreement (unlike plain NMI, which biases
   * upward with many small/uneven categories - exactly this data's
   * shape): ~0 for independent/random, 1 for an exact match, can go
   * slightly negative for worse-than-chance agreement. */
  ami: number;
  /** Adjusted Rand Index: pairwise agreement, corrected for chance. */
  ari: number;
  /** Permutation-test p-value for `ami` (see
   * pipeline/genre_alignment.py's `_permutation_test_ami`): the fraction
   * of random relabelings of the cluster assignment whose AMI meets or
   * exceeds the observed one. Raw, uncorrected for running this test
   * once per shipped signal. */
  amiPValue: number;
  /** `amiPValue` after Benjamini-Hochberg correction across every
   * shipped signal's own genre (or family) alignment test together - see
   * pipeline/export_clustering.py's `_attach_adjusted_ami_p_values`. This
   * is the number that should actually be read as "is this signal's
   * genre recovery real," not the raw `amiPValue` alone. */
  amiPValueAdjusted: number;
}

/** 2D spectral (Laplacian eigenmap) layout of this method's similarity
 * matrix, one x/y pair per psalm in the same order as
 * `ClusteringPayload.psalms` (see pipeline/embedding.py). Deliberately the
 * same normalized-Laplacian eigenspace `SpectralClusteringMethod` itself
 * partitions - not classical MDS, which optimizes a different objective
 * (preserve variance in the raw similarity matrix) with no guaranteed
 * relationship to the actual clustering, and could visually contradict the
 * cluster hulls drawn on top of it. Cluster membership is never a point
 * color (colors are reserved for the ground-truth reference - book or
 * Gunkel), so the scatter plot shows clusters via structure (e.g. a convex
 * hull per cluster) instead. */
export interface Embedding2D {
  x: number[];
  y: number[];
  /** Fraction of the corpus's total cluster-relevant spectral structure
   * these 2 dimensions capture (see pipeline/embedding.py's
   * `Embedding2D.structure_captured`) - the analogue of classical MDS's
   * "percent variance explained," adapted for the Laplacian's opposite
   * convention (a small eigenvalue is the meaningful one). Deliberately
   * not called "variance explained" - it isn't a decomposition of
   * statistical variance. Without this, there's no way to tell whether
   * two far-apart points are genuinely dissimilar or whether the 2D
   * projection is just discarding most of the real structure. */
  structureCaptured: number;
}

export interface ClusterMethodPayload {
  id: string;
  description: string;
  nClusters: number;
  /** p-value from testing this signal's winning k-partition against random
   * relabelings of its own distance matrix (see
   * pipeline/k_selection.py's `_partition_significance`) - `null` when
   * this cluster count wasn't chosen from the data at all (a `fixed_k`
   * method), or when `nClusters` is 1 (the gap statistic found no real
   * structure - see `k_selection.gap_statistic` - so there's no
   * multi-cluster partition left to test). Among signals where it does
   * apply, this saturates near the permutation floor (a spectral
   * partition fit to any non-uniform affinity matrix beats pure
   * label-scrambling almost always), so it's deliberately not surfaced
   * as a headline confidence claim in the UI - see `kStability` for the
   * diagnostic that actually discriminates. */
  partitionPValue: number | null;
  /** Fraction of subsamples (drawn without replacement - see
   * pipeline/k_selection.py's `subsample_k_stability`) whose own
   * silhouette sweep agreed with this exact k - `null` for the same
   * reasons as `partitionPValue`. Low values mean the chosen k is close
   * to a knife edge/coin flip across subsamples, not a settled cluster
   * count. */
  kStability: number | null;
  assignments: Record<string, number>;
  clusters: ClusterInfo[];
  embedding: Embedding2D;
  /** Cross-tab against Gunkel's 14-genre decomposition. */
  genreAlignment: GenreAlignment;
  /** Cross-tab against Gunkel's 6 top-level families - same shape, coarser
   * categories (see pipeline/genre_alignment.py). */
  familyAlignment: GenreAlignment;
}

export interface ClusteringPayload {
  generatedAt: string;
  corpus: { name: string; version: string };
  psalms: PsalmCore[];
  clusterMethods: ClusterMethodPayload[];
  defaultClusterMethod: string;
}

/** Mirrors the JSON payload written by
 * pipeline/src/tehillim_pipeline/export_gunkel.py - shared ground-truth
 * reference data (Gunkel's own genre/family classification) both pages'
 * psalm pickers use for their Books/Gunkel-6/Gunkel-14 coloring choice. */
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
