export interface ParallelismOverallRow {
  model: string;
  model_base: string;
  text_variant: string;
  separation_auc: number;
  separation_p_q: number;
  auc_vs_baseline: number;
  p_vs_baseline_q: number;
  average_precision: number;
  calibrated_effect_size: number;
  mrr_forward: number;
  n_true: number;
}

export interface ParallelismByTypeRow {
  model: string;
  model_base: string;
  text_variant: string;
  scope: string;
  separation_auc: number;
  separation_p_q: number;
  auc_vs_baseline: number;
  p_vs_baseline_q: number;
  average_precision: number;
  calibrated_effect_size: number;
  mrr_forward: number;
  n_true: number;
}

/** One source read at one unit register, and the classes it assigns, as the export catalogs it. */
export interface GenreRegister {
  taxonomy: string;
  unit: string | null;
  genres: string[];
}

/** What passage length alone scores on a register's pairs, the reference a model is read against. */
export interface GenreBaselineRow {
  taxonomy: string;
  unit: string | null;
  predictor: string;
  average_precision: number;
  separation_auc: number;
  prevalence: number;
  n_same_genre: number;
  n_different_genre: number;
}

export interface GenreOverallRow {
  model: string;
  model_base: string;
  text_variant: string;
  taxonomy: string;
  unit: string | null;
  separation_auc: number;
  auc_ci_low: number;
  auc_ci_high: number;
  average_precision: number;
  ap_ci_low: number;
  ap_ci_high: number;
  prevalence: number;
  n_same_genre: number;
  n_different_genre: number;
}

export interface GenreByGenreRow {
  model: string;
  taxonomy: string;
  unit: string | null;
  model_base: string;
  text_variant: string;
  genre: string;
  separation_auc: number;
  auc_ci_low: number;
  auc_ci_high: number;
  average_precision: number;
  ap_ci_low: number;
  ap_ci_high: number;
  prevalence: number;
  n_same_genre: number;
  n_different_genre: number;
}
