import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  genreByGenreColumns,
  genreOverallColumns,
  parallelismByTypeColumns,
  parallelismOverallColumns,
  trajectoryByGenreColumns,
  trajectoryOverallColumns,
} from "./tableColumns";
import type { TrajectoryByGenreRow, TrajectoryOverallRow } from "../../../shared/lib/results";

/** The CI cells render React nodes now, so assertions read the produced DOM. */
function cell(node: React.ReactNode): HTMLElement {
  cleanup();
  render(<div data-testid="cell">{node}</div>);
  return screen.getByTestId("cell");
}

function makeValidationRow(
  overrides: Partial<TrajectoryOverallRow> = {},
): TrajectoryOverallRow {
  return {
    model: "bge_m3_vocalized",
    model_base: "bge_m3",
    text_variant: "vocalized",
    metric: "content_distance",
    n_pairs_total: 100,
    n_pairs_valid: 100,
    raw_gap: 0.1,
    raw_p: 0.01,
    raw_effect_size: 1.0,
    raw_q: 0.02,
    raw_q_by: 0.03,
    length_controlled_gap: 0.05,
    length_controlled_p: 0.03,
    length_controlled_effect_size: 0.5,
    length_controlled_q: 0.04,
    length_controlled_q_by: 0.05,
    length_and_content_controlled_gap: NaN,
    length_and_content_controlled_p: NaN,
    length_and_content_controlled_effect_size: NaN,
    length_and_content_controlled_q: NaN,
    length_and_content_controlled_q_by: NaN,
    ...overrides,
  };
}

describe("parallelismOverallColumns", () => {
  it("matches ui_export.export's _PARALLELISM_OVERALL_COLUMNS field set, sample size trailing the statistics it supports", () => {
    expect(parallelismOverallColumns().map((c) => c.key)).toEqual([
      "model_base",
      "separation_auc",
      "separation_p_q",
      "auc_vs_baseline",
      "p_vs_baseline_q",
      "average_precision",
      "calibrated_effect_size",
      "mrr_forward",
      "n_true",
    ]);
  });

  it("renders both significance columns as q pills", () => {
    const columns = parallelismOverallColumns();
    expect(columns.find((c) => c.key === "separation_p_q")?.type).toBe("pill");
    expect(columns.find((c) => c.key === "p_vs_baseline_q")?.type).toBe("pill");
  });

  it("keeps the effect size label short since genre no longer has a competing effect size column", () => {
    const column = parallelismOverallColumns().find((c) => c.key === "calibrated_effect_size");
    expect(column?.label).toBe("Effect size");
  });
});

describe("parallelismByTypeColumns", () => {
  it("matches ui_export.export's _PARALLELISM_BY_TYPE_COLUMNS field set, sample size trailing", () => {
    expect(parallelismByTypeColumns().map((c) => c.key)).toEqual([
      "model_base",
      "separation_auc",
      "separation_p_q",
      "auc_vs_baseline",
      "p_vs_baseline_q",
      "average_precision",
      "calibrated_effect_size",
      "mrr_forward",
      "n_true",
    ]);
  });

  it("renders both significance columns as q pills", () => {
    const columns = parallelismByTypeColumns();
    expect(columns.find((c) => c.key === "separation_p_q")?.type).toBe("pill");
    expect(columns.find((c) => c.key === "p_vs_baseline_q")?.type).toBe("pill");
  });

  it("keeps the effect size label short, matching the overall table", () => {
    const column = parallelismByTypeColumns().find((c) => c.key === "calibrated_effect_size");
    expect(column?.label).toBe("Effect size");
  });
});

describe("genreOverallColumns", () => {
  it("matches ui_export.export's _GENRE_OVERALL_COLUMNS field set, sample sizes trailing", () => {
    expect(genreOverallColumns().map((c) => c.key)).toEqual([
      "model_base",
      "separation_auc",
      "auc_ci",
      "average_precision",
      "ap_ci",
      "n_same_genre",
      "n_different_genre",
    ]);
  });

  const baseRow = {
    model: "m",
    model_base: "m",
    text_variant: "unknown",
    separation_auc: 0.6,
    auc_ci_low: 0.55,
    auc_ci_high: 0.65,
    average_precision: 0.3,
    ap_ci_low: 0.25,
    ap_ci_high: 0.35,
    prevalence: 0.2,
    n_same_genre: 500,
    n_different_genre: 4700,
  };

  it("renders the AUC confidence interval as a colored pill against the 0.5 chance level", () => {
    const column = genreOverallColumns().find((c) => c.key === "auc_ci");
    expect(cell(column?.render?.(baseRow)).querySelector(".pill")).toHaveClass("good");
    expect(cell(column?.render?.(baseRow))).toHaveTextContent("[0.5500, 0.6500]");
    expect(
      cell(column?.render?.({ ...baseRow, auc_ci_low: NaN, auc_ci_high: NaN })),
    ).toHaveTextContent("—");
  });

  it("renders the AP confidence interval as a colored pill against that row's own prevalence", () => {
    const column = genreOverallColumns().find((c) => c.key === "ap_ci");
    expect(cell(column?.render?.(baseRow)).querySelector(".pill")).toHaveClass("good");
    expect(
      cell(column?.render?.({ ...baseRow, prevalence: 0.4 })).querySelector(".pill"),
    ).toHaveClass("bad");
  });

  it("carries no separate q pill for a metric that already has a CI pill", () => {
    const columns = genreOverallColumns();
    const qKeys = ["separation_p_q", "perm_q", "maxT_q"];
    expect(columns.some((c) => qKeys.includes(c.key))).toBe(false);
  });

  it("shows the different-genre population size alongside the same-genre one", () => {
    const columns = genreOverallColumns();
    expect(columns.some((c) => c.key === "n_different_genre")).toBe(true);
  });
});

describe("genreByGenreColumns", () => {
  it("matches ui_export.export's _GENRE_BY_GENRE_COLUMNS field set, sample sizes trailing", () => {
    expect(genreByGenreColumns().map((c) => c.key)).toEqual([
      "model",
      "separation_auc",
      "auc_ci",
      "average_precision",
      "ap_ci",
      "n_same_genre",
      "n_different_genre",
    ]);
  });

  it("carries no separate q pill for a metric that already has a CI pill", () => {
    const columns = genreByGenreColumns();
    const qKeys = ["separation_p_q", "perm_q", "maxT_q"];
    expect(columns.some((c) => qKeys.includes(c.key))).toBe(false);
  });

  const byGenreRow = {
    model: "m",
    model_base: "m",
    text_variant: "unknown",
    genre: "Wisdom",
    separation_auc: 0.6,
    auc_ci_low: 0.5,
    auc_ci_high: 0.7,
    average_precision: 0.3,
    ap_ci_low: 0.27,
    ap_ci_high: 0.37,
    prevalence: 0.2,
    n_same_genre: 200,
    n_different_genre: 1900,
  };

  it("renders the per-genre AUC confidence interval as a colored pill", () => {
    const column = genreByGenreColumns().find((c) => c.key === "auc_ci");
    expect(cell(column?.render?.(byGenreRow))).toHaveTextContent("[0.5000, 0.7000]");
  });

  it("renders the per-genre AP confidence interval as a colored pill against that row's own prevalence", () => {
    const column = genreByGenreColumns().find((c) => c.key === "ap_ci");
    expect(cell(column?.render?.(byGenreRow)).querySelector(".pill")).toHaveClass("good");
    expect(cell(column?.render?.(byGenreRow))).toHaveTextContent("[0.2700, 0.3700]");
  });
});

describe("trajectoryOverallColumns", () => {
  it("prepends a Name column ahead of the visible-source stat columns", () => {
    const columns = trajectoryOverallColumns([makeValidationRow()]);
    expect(columns[0]!.key).toBe("model_base");
    expect(columns[0]!.label).toBe("Name");
  });

  it("shows the valid-pair sample size last, after the stats it supports", () => {
    const columns = trajectoryOverallColumns([makeValidationRow()]);
    expect(columns.at(-1)!.key).toBe("n_pairs_valid");
  });

  it("omits length_and_content_controlled columns when no row in the group has them", () => {
    const columns = trajectoryOverallColumns([makeValidationRow()]);
    expect(columns.some((c) => c.key.startsWith("length_and_content_controlled"))).toBe(false);
  });
});

describe("trajectoryByGenreColumns", () => {
  it("matches the by-genre trajectory field set, source shown as plain text", () => {
    const columns = trajectoryByGenreColumns();
    expect(columns.map((c) => c.key)).toEqual([
      "model_base",
      "source",
      "gap",
      "p_perm",
      "perm_q",
      "maxT_q",
    ]);
    expect(columns.find((c) => c.key === "source")?.type).toBe("text");
  });

  const sourceCell = (source: string): HTMLElement => {
    const column = trajectoryByGenreColumns().find((c) => c.key === "source");
    return cell(column?.render?.({ source } as TrajectoryByGenreRow));
  };

  it("marks the raw source uncontrolled, since it is the length-confounded quantity", () => {
    expect(sourceCell("raw")).toHaveTextContent("Raw (uncontrolled)");
  });

  it("names each controlled source by what it controls for", () => {
    expect(sourceCell("length_controlled")).toHaveTextContent("Length controlled");
    expect(sourceCell("length_and_content_controlled")).toHaveTextContent(
      "Length + content controlled",
    );
  });

  it("shows an unrecognised source verbatim rather than blanking the cell", () => {
    expect(sourceCell("something_new")).toHaveTextContent("something_new");
  });
});
