import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GenreSection } from "./GenreSection";
import type { PlotFn } from "../../../../shared/charts";
import type { GenreSection as Section } from "../../model/types";

const section: Section = {
  genre_order: [
    { item: "1", psalm: 1, label: "Ps 1", genre: "Wisdom" },
    { item: "2", psalm: 2, label: "Ps 2", genre: "Royal" },
    { item: "3", psalm: 3, label: "Ps 3", genre: "Royal" },
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
    { item_a: "1", item_b: "2", value: 0.4 },
    { item_a: "2", item_b: "3", value: -0.2 },
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

const GENRES = ["Royal", "Wisdom"];

const renderSection = (category = "Genre", itemName = "psalm"): void => {
  cleanup();
  render(
    <GenreSection
      section={section}
      genres={GENRES}
      category={category}
      itemName={itemName}
      plot={fakePlot}
    />,
  );
};

describe("GenreSection", () => {
  it("leads with the discrimination claim, then the scores, then the structure", () => {
    renderSection();
    const titles = screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
    expect(titles).toEqual([
      "ROC curve",
      "Precision–Recall curve",
      "Calibrated score by genre",
      "Pairwise similarity by psalm",
    ]);
  });

  it("heads the charts with the register's words for its classes and items", () => {
    renderSection("Gattung", "passage");
    const titles = screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
    expect(titles).toContain("Calibrated score by gattung");
    expect(titles).toContain("Pairwise similarity by passage");
  });

  it("labels the full matrix by the export's passage labels", () => {
    mounted.length = 0;
    renderSection();
    const full = mounted.at(-1) as { traces: { text?: string[][] }[] };
    expect(full.traces[0]?.text?.[0]?.[0]).toBe("Ps 1");
    expect(full.traces[0]?.text?.[0]?.[1]).toBe("Ps 1 vs Ps 2<br>calibrated_z: 0.400");
  });

  it("states the bootstrapped AUC and AP with their intervals", () => {
    renderSection();
    expect(screen.getByText("0.664")).toBeInTheDocument();
    expect(screen.getByText("[0.611, 0.709]")).toBeInTheDocument();
    expect(screen.getByText("0.394")).toBeInTheDocument();
  });

  it("names every series once, in one key for the whole section", () => {
    renderSection();
    expect(screen.getAllByText("Combined")).toHaveLength(1);
    expect(screen.getAllByText("Wisdom")).toHaveLength(1);
  });

  it("mounts every chart the section declares, matrices included", () => {
    mounted.length = 0;
    renderSection();
    expect(mounted).toHaveLength(5);
  });
});
