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

/** One passage-pair cell of a full pairwise matrix, the passages named by their export ids. */
export interface ItemPairCell {
  item_a: string;
  item_b: string;
  value: number;
}

/** One position on a class-grouped matrix axis, whatever the export names its items by. */
export interface AxisEntry {
  key: string;
  label: string;
  genre: string;
}

/** One cell of a full pairwise matrix, both ends keyed as the axis is. */
export interface PairCell {
  a: string;
  b: string;
  value: number;
}

/** One (genre, genre) cell of the reduced genre-mean summary matrix. */
export interface GenreMeanCell {
  genre_a: string;
  genre_b: string;
  value: number;
}

/** One passage's position in the class-grouped matrix axis order, with the psalm it sits in. */
export interface GenreOrderEntry {
  item: string;
  psalm: number;
  label: string;
  genre: string;
}

/** The parallelism domain's detail data: marked-parallel vs. baseline separation. */
export interface ParallelismSection {
  raincloud_groups: RaincloudGroup[];
  series: CurveSeries[];
  auc_ap_stats: AucApStats;
}

/** One register's detail data: same- vs. different-class separation, plus the full pairwise matrix. */
export interface GenreSection {
  genre_order: GenreOrderEntry[];
  raincloud_groups: RaincloudGroup[];
  series: CurveSeries[];
  heatmap: ItemPairCell[];
  heatmap_genre_mean: GenreMeanCell[];
  auc_ap_stats: AucApStats;
}

/** One model's detail export: the section the file was cut for, keyed as the export names it. */
export interface DetailData {
  model: string;
  domain: string;
  parallelism?: ParallelismSection;
  [register: `genre_${string}`]: GenreSection | undefined;
}
