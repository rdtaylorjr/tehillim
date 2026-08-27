import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TrajectorySection } from "./TrajectorySection";
import type { PlotFn } from "../../charts/plot";
import type { TrajectorySection as Section, TrajectorySourceData } from "../../model/types";

const mounted: unknown[] = [];
const fakePlot: PlotFn = (_mount, traces, layout) => {
  mounted.push({ traces, layout });
  return Promise.resolve({ on: () => undefined } as never);
};

const source = (gap: number, p: number): TrajectorySourceData => ({
  raincloud: {
    same: { key: "combined", label: "Within genre", n: 40, values: [0.1, 0.2, 0.3], mean: 0.2 },
    different: {
      key: "different",
      label: "Across genre",
      n: 80,
      values: [0.3, 0.4],
      mean: 0.35,
    },
  },
  heatmap: [{ psalm_a: 1, psalm_b: 2, value: 0.05 }],
  heatmap_genre_mean: [{ genre_a: "Wisdom", genre_b: "Royal", value: 0.02 }],
  gap_stats: { gap, p, effect_size: 1.4 },
});

const section: Section = {
  metric: "structural_distance",
  order: [
    { psalm: 1, genre: "Wisdom" },
    { psalm: 2, genre: "Royal" },
  ],
  sources: {
    length_controlled: source(0.0612, 0.0031),
    length_and_content_controlled: source(0.0012, 0.42),
  },
};

const show = (): void => {
  cleanup();
  mounted.length = 0;
  render(<TrajectorySection section={section} plot={fakePlot} />);
};

describe("TrajectorySection", () => {
  it("shows both controlled sources, each named by what it controls for", () => {
    show();
    const titles = screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
    expect(titles).toEqual([
      "Residual distance by genre · Length-controlled",
      "Pairwise distance by psalm · Length-controlled",
      "Residual distance by genre · Length + content-controlled",
      "Pairwise distance by psalm · Length + content-controlled",
    ]);
  });

  it("marks a significant gap and flags one that is not", () => {
    show();
    expect(screen.getByText("0.003")).toHaveClass("good");
    const weak = screen.getByText(/0.420/);
    expect(weak).toHaveClass("warn");
    expect(weak).toHaveTextContent("not significant");
  });

  it("states each source's gap and effect size", () => {
    show();
    expect(screen.getByText("0.0612")).toBeInTheDocument();
    expect(screen.getByText("0.0012")).toBeInTheDocument();
  });

  it("mounts a raincloud and a matrix pair for each source", () => {
    show();
    expect(mounted).toHaveLength(6);
  });

  it("draws no ROC or PR curve, since a permutation gap is not a classifier", () => {
    show();
    expect(screen.queryByText("ROC curve")).not.toBeInTheDocument();
    expect(screen.queryByText("Precision–Recall curve")).not.toBeInTheDocument();
  });
});
