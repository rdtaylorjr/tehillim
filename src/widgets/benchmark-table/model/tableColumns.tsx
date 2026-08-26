import { trajectoryColumns } from "./trajectoryColumns";
import { variantLabel } from "./variantLabel";
import type {
  GenreByGenreRow,
  GenreOverallRow,
  ParallelismByTypeRow,
  ParallelismOverallRow,
  TrajectoryByGenreRow,
  TrajectoryOverallRow,
} from "../../../shared/lib/results";
import { ciPill } from "../../../shared/ui/Pill";
import type { TableColumn } from "../../../shared/lib/results";

/** AUC's chance level is fixed at 0.5; AP's is the positive-class prevalence, which varies per row. */
const AUC_CHANCE_LEVEL = 0.5;

function nameColumn<
  T extends { model_base?: string; text_variant?: string },
>(): TableColumn<T> {
  return {
    key: "model_base",
    label: "Name",
    type: "text",
    render: variantLabel,
  };
}

function parallelismSignificanceColumns<
  T extends {
    separation_p_q?: number;
    auc_vs_baseline?: number;
    p_vs_baseline_q?: number;
  },
>(): TableColumn<T>[] {
  return [
    {
      key: "separation_p_q",
      label: "Sig (FDR q)",
      type: "pill",
      pillPrefix: "q",
    },
    {
      key: "auc_vs_baseline",
      label: "AUC (vs. baseline)",
      type: "num",
      digits: 4,
    },
    {
      key: "p_vs_baseline_q",
      label: "Sig (vs. baseline)",
      type: "pill",
      pillPrefix: "q",
    },
  ];
}

export function parallelismOverallColumns(): TableColumn<ParallelismOverallRow>[] {
  return [
    nameColumn<ParallelismOverallRow>(),
    { key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 },
    ...parallelismSignificanceColumns<ParallelismOverallRow>(),
    { key: "average_precision", label: "AP", type: "num", digits: 4 },
    {
      key: "calibrated_effect_size",
      label: "Effect size",
      type: "num",
      digits: 3,
    },
    { key: "mrr_forward", label: "MRR (fwd)", type: "num", digits: 4 },
    { key: "n_true", label: "n pairs", type: "num", digits: 0 },
  ];
}

export function parallelismByTypeColumns(): TableColumn<ParallelismByTypeRow>[] {
  return [
    nameColumn<ParallelismByTypeRow>(),
    { key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 },
    ...parallelismSignificanceColumns<ParallelismByTypeRow>(),
    { key: "average_precision", label: "AP", type: "num", digits: 4 },
    {
      key: "calibrated_effect_size",
      label: "Effect size",
      type: "num",
      digits: 3,
    },
    { key: "mrr_forward", label: "MRR (fwd)", type: "num", digits: 4 },
    { key: "n_true", label: "n pairs", type: "num", digits: 0 },
  ];
}

export function genreOverallColumns(): TableColumn<GenreOverallRow>[] {
  return [
    nameColumn<GenreOverallRow>(),
    { key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 },
    {
      key: "auc_ci",
      label: "AUC 95% CI",
      type: "pill",
      render: (r) => ciPill(r.auc_ci_low, r.auc_ci_high, AUC_CHANCE_LEVEL),
    },
    { key: "average_precision", label: "AP", type: "num", digits: 4 },
    {
      key: "ap_ci",
      label: "AP 95% CI",
      type: "pill",
      render: (r) => ciPill(r.ap_ci_low, r.ap_ci_high, r.prevalence),
    },
    { key: "n_same_genre", label: "n same-genre", type: "num", digits: 0 },
    {
      key: "n_different_genre",
      label: "n different-genre",
      type: "num",
      digits: 0,
    },
  ];
}

export function genreByGenreColumns(): TableColumn<GenreByGenreRow>[] {
  return [
    { key: "model", label: "Name", type: "text" },
    { key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 },
    {
      key: "auc_ci",
      label: "AUC 95% CI",
      type: "pill",
      render: (r) => ciPill(r.auc_ci_low, r.auc_ci_high, AUC_CHANCE_LEVEL),
    },
    { key: "average_precision", label: "AP", type: "num", digits: 4 },
    {
      key: "ap_ci",
      label: "AP 95% CI",
      type: "pill",
      render: (r) => ciPill(r.ap_ci_low, r.ap_ci_high, r.prevalence),
    },
    { key: "n_same_genre", label: "n same-genre", type: "num", digits: 0 },
    {
      key: "n_different_genre",
      label: "n different-genre",
      type: "num",
      digits: 0,
    },
  ];
}

export function trajectoryOverallColumns(
  rows: TrajectoryOverallRow[],
): TableColumn<TrajectoryOverallRow>[] {
  return [
    nameColumn<TrajectoryOverallRow>(),
    ...trajectoryColumns(rows),
    { key: "n_pairs_valid", label: "n pairs", type: "num", digits: 0 },
  ];
}

/** Raw is the length-confounded distance, so it is named as such wherever it is read. */
const SOURCE_LABELS: Record<string, string> = {
  raw: "Raw (uncontrolled)",
  length_controlled: "Length controlled",
  length_and_content_controlled: "Length + content controlled",
};

export function trajectoryByGenreColumns(): TableColumn<TrajectoryByGenreRow>[] {
  return [
    nameColumn<TrajectoryByGenreRow>(),
    {
      key: "source",
      label: "Source",
      type: "text",
      render: (row) => SOURCE_LABELS[row.source] ?? row.source,
    },
    { key: "gap", label: "Gap", type: "num", digits: 5 },
    { key: "p_perm", label: "p (perm)", type: "pill", pillPrefix: "p" },
    {
      key: "perm_q",
      label: "q (perm)",
      type: "pill",
      pillPrefix: "q",
    },
    { key: "maxT_q", label: "q (maxT)", type: "pill", pillPrefix: "q" },
  ];
}
