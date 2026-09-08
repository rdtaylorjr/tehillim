import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenchmarkFigure, ClusterFigure, CompareFigure } from "./HomeFigures";
import type { HomeFigures } from "../api/loadHomeFigures";

const row = (model: string, auc: number): Record<string, unknown> => ({
  model,
  model_base: model,
  text_variant: "cantillation",
  separation_auc: auc,
  separation_p_q: 0.0001,
  auc_vs_baseline: auc - 0.1,
  p_vs_baseline_q: 0.0001,
  average_precision: auc,
  calibrated_effect_size: 1,
  mrr_forward: 0.5,
  n_true: 100,
});

const figures = {
  benchmark: {
    rows: Array.from({ length: 10 }, (_, i) => row(`model_${String(i)}`, 0.9 - i / 100)),
  },
  compare: {
    psalms: [1, 2, 3],
    matrix: [
      [1, 0.2, 0.1],
      [0.2, 1, 0.3],
      [0.1, 0.3, 1],
    ],
    domainMax: 0.3,
  },
  cluster: {
    alignment: {
      genres: ["Hymn", "Lament"],
      clusterGenreLabels: ["Hymn", null],
      counts: [
        [8, 2],
        [1, 9],
      ],
      genreTotals: [10, 10],
      clusterTotals: [9, 11],
      purity: 0.85,
      ami: 0.4,
      ari: 0.3,
    },
  },
} as unknown as HomeFigures;

describe("the landing page's figures", () => {
  it("draws the real results table, from the payload's rows", () => {
    const { container } = render(<BenchmarkFigure figures={figures} />);
    expect(container.querySelector("table")).toBeInTheDocument();
    expect(screen.getByText("model_0")).toBeInTheDocument();
    expect(screen.getByText("0.9000")).toBeInTheDocument();
  });

  it("carries more rows than it shows, so the table is cut at a row rule", () => {
    const { container } = render(<BenchmarkFigure figures={figures} />);
    expect(container.querySelectorAll("tbody tr").length).toBeGreaterThan(8);
  });

  it("hides every figure from assistive technology, since the card's link carries it", () => {
    const { container } = render(<BenchmarkFigure figures={figures} />);
    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("mounts the matrix renderer the compare page uses", () => {
    const { container } = render(<CompareFigure figures={figures} />);
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
  });

  it("draws the alluvial with a node per genre and no cluster labels", () => {
    const { container } = render(<ClusterFigure figures={figures} />);
    const labels = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(labels).toContain("Hymn");
    expect(labels).toContain("Lament");
    expect(labels.join(" ")).not.toContain("Cluster");
  });

  it("names a genre without its count, which a card has no room to explain", () => {
    const { container } = render(<ClusterFigure figures={figures} />);
    const labels = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(labels).not.toContain("Hymn (10)");
  });
});
