/** One distribution group (a parallelism type, a genre, or a reference class) for a raincloud plot. */
export interface RaincloudGroup {
  key: string;
  label: string;
  n: number;
  values: number[];
  mean: number;
}

/** One point on an ROC curve. */
export interface RocPoint {
  fpr: number;
  tpr: number;
}

/** One point on a Precision-Recall curve. */
export interface PrPoint {
  recall: number;
  precision: number;
}

/** One named ROC+PR curve pair (the combined series, or a one-vs-rest breakdown). */
export interface CurveSeries {
  name: string;
  n: number;
  roc: RocPoint[];
  pr: PrPoint[];
}

/** Bootstrapped AUC and AP point estimates with their BCa confidence intervals. */
export interface AucApStats {
  auc: number;
  auc_ci_low: number;
  auc_ci_high: number;
  ap: number;
  ap_ci_low: number;
  ap_ci_high: number;
}

/** One psalm-pair cell of a full pairwise matrix. */
export interface HeatmapCell {
  psalm_a: number;
  psalm_b: number;
  value: number;
}

/** One (genre, genre) cell of the reduced genre-mean summary matrix. */
export interface GenreMeanCell {
  genre_a: string;
  genre_b: string;
  value: number;
}

/** One psalm's position in the genre-grouped matrix axis order. */
export interface PsalmOrderEntry {
  psalm: number;
  genre: string;
}

/** A permutation-test gap statistic between within-genre and across-genre pairwise distance. */
export interface GapStats {
  gap: number;
  p: number;
  effect_size: number;
}

/** The parallelism domain's detail data: marked-parallel vs. baseline separation. */
export interface ParallelismSection {
  raincloud_groups: RaincloudGroup[];
  series: CurveSeries[];
  auc_ap_stats: AucApStats;
}

/** The genre domain's detail data: same- vs. different-genre separation, plus the full pairwise matrix. */
export interface GenreSection {
  genre_order: PsalmOrderEntry[];
  raincloud_groups: RaincloudGroup[];
  series: CurveSeries[];
  heatmap: HeatmapCell[];
  heatmap_genre_mean: GenreMeanCell[];
  auc_ap_stats: AucApStats;
}

/** One trajectory source's (length-controlled or length-and-content-controlled) detail data. */
export interface TrajectorySourceData {
  raincloud: { same: RaincloudGroup; different: RaincloudGroup };
  heatmap: HeatmapCell[];
  heatmap_genre_mean: GenreMeanCell[];
  gap_stats: GapStats;
}

/** The trajectory domain's detail data for one metric, across both controlled sources. */
export interface TrajectorySection {
  metric: string;
  order: PsalmOrderEntry[];
  sources: {
    length_controlled: TrajectorySourceData;
    length_and_content_controlled: TrajectorySourceData;
  };
}

/** One model's full stopgap detail export: whichever domain sections apply to it. */
export interface DetailData {
  model: string;
  domain: string;
  parallelism?: ParallelismSection;
  genre?: GenreSection;
  trajectory?: TrajectorySection;
}
