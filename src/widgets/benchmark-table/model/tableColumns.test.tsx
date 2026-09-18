import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  genreByGenreColumns,
  genreOverallColumns,
  parallelismByTypeColumns,
  parallelismOverallColumns,
} from "./tableColumns";

/** The CI cells render React nodes now, so assertions read the produced DOM. */
function cell(node: React.ReactNode): HTMLElement {
  cleanup();
  render(<div data-testid="cell">{node}</div>);
  return screen.getByTestId("cell");
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
    expect(genreOverallColumns("Genre").map((c) => c.key)).toEqual([
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
    taxonomy: "logos",
    unit: null,
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
    const column = genreOverallColumns("Genre").find((c) => c.key === "auc_ci");
    expect(cell(column?.render?.(baseRow)).querySelector(".pill")).toHaveClass("good");
    expect(cell(column?.render?.(baseRow))).toHaveTextContent("[0.5500, 0.6500]");
    expect(
      cell(column?.render?.({ ...baseRow, auc_ci_low: NaN, auc_ci_high: NaN })),
    ).toHaveTextContent("—");
  });

  it("renders the AP confidence interval as a colored pill against that row's own prevalence", () => {
    const column = genreOverallColumns("Genre").find((c) => c.key === "ap_ci");
    expect(cell(column?.render?.(baseRow)).querySelector(".pill")).toHaveClass("good");
    expect(
      cell(column?.render?.({ ...baseRow, prevalence: 0.4 })).querySelector(".pill"),
    ).toHaveClass("bad");
  });

  it("carries no separate q pill for a metric that already has a CI pill", () => {
    const columns = genreOverallColumns("Genre");
    const qKeys = ["separation_p_q", "perm_q", "maxT_q"];
    expect(columns.some((c) => qKeys.includes(c.key))).toBe(false);
  });

  it("shows the different-genre population size alongside the same-genre one", () => {
    const columns = genreOverallColumns("Genre");
    expect(columns.some((c) => c.key === "n_different_genre")).toBe(true);
  });

  it("heads the pair counts with the source's word for a class", () => {
    const labels = genreOverallColumns("Gattung").map((c) => c.label);
    expect(labels).toContain("n same-gattung");
    expect(labels).toContain("n different-gattung");
    expect(genreByGenreColumns("Gattung").map((c) => c.label)).toContain("n same-gattung");
  });
});

describe("genreByGenreColumns", () => {
  it("matches ui_export.export's _GENRE_BY_GENRE_COLUMNS field set, sample sizes trailing", () => {
    expect(genreByGenreColumns("Genre").map((c) => c.key)).toEqual([
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
    const columns = genreByGenreColumns("Genre");
    const qKeys = ["separation_p_q", "perm_q", "maxT_q"];
    expect(columns.some((c) => qKeys.includes(c.key))).toBe(false);
  });

  const byGenreRow = {
    model: "m",
    model_base: "m",
    text_variant: "unknown",
    taxonomy: "logos",
    unit: null,
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
    const column = genreByGenreColumns("Genre").find((c) => c.key === "auc_ci");
    expect(cell(column?.render?.(byGenreRow))).toHaveTextContent("[0.5000, 0.7000]");
  });

  it("renders the per-genre AP confidence interval as a colored pill against that row's own prevalence", () => {
    const column = genreByGenreColumns("Genre").find((c) => c.key === "ap_ci");
    expect(cell(column?.render?.(byGenreRow)).querySelector(".pill")).toHaveClass("good");
    expect(cell(column?.render?.(byGenreRow))).toHaveTextContent("[0.2700, 0.3700]");
  });
});
