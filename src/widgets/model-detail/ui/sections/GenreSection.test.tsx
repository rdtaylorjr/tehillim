import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GenreSection } from "./GenreSection";
import type { PlotFn } from "../../charts/plot";
import type { GenreSection as Section } from "../../model/types";

const section: Section = {
  genre_order: [
    { psalm: 1, genre: "Wisdom" },
    { psalm: 2, genre: "Royal" },
    { psalm: 3, genre: "Royal" },
  ],
  raincloud_groups: [
    {
      key: "combined",
      label: "Same genre (combined)",
      n: 60,
      values: [0.1, 0.5, 0.9],
      mean: 0.5,
    },
    { key: "different", label: "Different genre", n: 90, values: [0.2, 0.3, 0.4], mean: 0.3 },
    { key: "Wisdom", label: "Wisdom", n: 30, values: [0.4, 0.6], mean: 0.5 },
  ],
  series: [
    {
      name: "Combined",
      n: 60,
      roc: [
        { fpr: 0, tpr: 0 },
        { fpr: 0.4, tpr: 0.7 },
        { fpr: 1, tpr: 1 },
      ],
      pr: [
        { recall: 0, precision: 1 },
        { recall: 1, precision: 0.3 },
      ],
    },
    {
      name: "Wisdom",
      n: 30,
      roc: [
        { fpr: 0, tpr: 0 },
        { fpr: 1, tpr: 1 },
      ],
      pr: [
        { recall: 0, precision: 1 },
        { recall: 1, precision: 0.2 },
      ],
    },
  ],
  heatmap: [
    { psalm_a: 1, psalm_b: 2, value: 0.4 },
    { psalm_a: 2, psalm_b: 3, value: -0.2 },
  ],
  heatmap_genre_mean: [
    { genre_a: "Wisdom", genre_b: "Royal", value: 0.3 },
    { genre_a: "Royal", genre_b: "Royal", value: -0.1 },
  ],
  auc_ap_stats: {
    auc: 0.664,
    auc_ci_low: 0.611,
    auc_ci_high: 0.709,
    ap: 0.394,
    ap_ci_low: 0.319,
    ap_ci_high: 0.436,
  },
};

/** Counts what each chart hands Plotly, without a real canvas jsdom cannot provide. */
const mounted: unknown[] = [];
const fakePlot: PlotFn = (_mount, traces, layout) => {
  mounted.push({ traces, layout });
  return Promise.resolve({ on: () => undefined } as never);
};

describe("GenreSection", () => {
  it("leads with the discrimination claim, then the scores, then the structure", () => {
    cleanup();
    render(<GenreSection section={section} plot={fakePlot} />);
    const titles = screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
    expect(titles).toEqual([
      "ROC curve",
      "Precision–Recall curve",
      "Calibrated score by genre",
      "Pairwise similarity by psalm",
    ]);
  });

  it("states the bootstrapped AUC and AP with their intervals", () => {
    cleanup();
    render(<GenreSection section={section} plot={fakePlot} />);
    expect(screen.getByText("0.664")).toBeInTheDocument();
    expect(screen.getByText("[0.611, 0.709]")).toBeInTheDocument();
    expect(screen.getByText("0.394")).toBeInTheDocument();
  });

  it("names every series once, in one key for the whole section", () => {
    cleanup();
    render(<GenreSection section={section} plot={fakePlot} />);
    expect(screen.getAllByText("Combined")).toHaveLength(1);
    expect(screen.getAllByText("Wisdom")).toHaveLength(1);
  });

  it("mounts every chart the section declares, matrices included", () => {
    cleanup();
    cleanup();
    mounted.length = 0;
    render(<GenreSection section={section} plot={fakePlot} />);
    expect(mounted).toHaveLength(5);
  });
});
