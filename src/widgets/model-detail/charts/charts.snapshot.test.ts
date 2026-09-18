import { describe, expect, it } from "vitest";
import { mountRainclouds } from "./rainclouds";
import { mountMultiCurve } from "./curves";
import { matrixMargin, mountHeatmap, mountGenreMeanMatrix } from "./heatmap";
import type { PlotFn } from "../../../shared/charts";
import type {
  CurveSeries,
  GenreMeanCell,
  AxisEntry,
  PairCell,
  RaincloudGroup,
} from "../model/types";

/** Captures exactly what each chart hands Plotly, so a refactor that alters a pixel fails here. */
function capture(): { plot: PlotFn; calls: unknown[] } {
  const calls: unknown[] = [];
  const plot: PlotFn = (_mount, traces, layout, config) => {
    calls.push({ traces, layout, config });
    return Promise.resolve({ on: () => undefined } as never);
  };
  return { plot, calls };
}

/** Two charts attach hover handlers to the mount itself, so the stand-in carries Plotly's `on`. */
const el = (): HTMLElement => {
  const node = document.createElement("div");
  (node as unknown as { on: () => void }).on = () => undefined;
  return node;
};
const color = (k: string): string => `#${k.length.toString(16).padStart(6, "0")}`;

const GROUPS: RaincloudGroup[] = [
  { key: "a", label: "Alpha", n: 60, values: [0.1, 0.4, 0.35, 0.7, 0.22], mean: 0.354 },
  { key: "b", label: "Beta", n: 8, values: [0.5, 0.55, 0.6], mean: 0.55 },
];
const SERIES: CurveSeries[] = [
  {
    name: "Combined",
    n: 40,
    roc: [
      { fpr: 0, tpr: 0 },
      { fpr: 0.25, tpr: 0.6 },
      { fpr: 1, tpr: 1 },
    ],
    pr: [
      { recall: 0, precision: 1 },
      { recall: 0.5, precision: 0.8 },
      { recall: 1, precision: 0.4 },
    ],
  },
];
const ORDER: AxisEntry[] = [
  { key: "1", label: "Psalm 1", genre: "Wisdom" },
  { key: "2", label: "Psalm 2", genre: "Royal" },
  { key: "3", label: "Psalm 3", genre: "Royal" },
];
const CELLS: PairCell[] = [
  { a: "1", b: "2", value: 0.4 },
  { a: "2", b: "3", value: -0.2 },
  { a: "1", b: "3", value: 0.9 },
];
const MEANS: GenreMeanCell[] = [
  { genre_a: "Wisdom", genre_b: "Royal", value: 0.3 },
  { genre_a: "Royal", genre_b: "Royal", value: -0.1 },
];

describe("chart output is stable", () => {
  it("rainclouds hand Plotly an unchanging payload", () => {
    const { plot, calls } = capture();
    mountRainclouds(el(), GROUPS, color, "Score", plot);
    expect(calls).toMatchSnapshot();
  });

  it("ROC curves hand Plotly an unchanging payload", () => {
    const { plot, calls } = capture();
    mountMultiCurve(
      el(),
      SERIES,
      "roc",
      "fpr",
      "tpr",
      "FPR",
      "TPR",
      color,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      true,
      plot,
    );
    expect(calls).toMatchSnapshot();
  });

  it("PR curves hand Plotly an unchanging payload", () => {
    const { plot, calls } = capture();
    mountMultiCurve(
      el(),
      SERIES,
      "pr",
      "recall",
      "precision",
      "Recall",
      "Precision",
      color,
      [
        { x: 0, y: 0.25 },
        { x: 1, y: 0.25 },
      ],
      false,
      plot,
    );
    expect(calls).toMatchSnapshot();
  });

  it("the pairwise heatmap hands Plotly an unchanging payload", () => {
    const { plot, calls } = capture();
    mountHeatmap(el(), CELLS, ORDER, "z", plot);
    expect(calls).toMatchSnapshot();
  });

  it("the genre-mean matrix hands Plotly an unchanging payload", () => {
    const { plot, calls } = capture();
    mountGenreMeanMatrix(el(), MEANS, ["Wisdom", "Royal"], "mean z", plot);
    expect(calls).toMatchSnapshot();
  });
});

describe("matrixMargin", () => {
  it("keeps the default face for short class names", () => {
    expect(matrixMargin(["Hymn", "Wisdom"]).l).toBe(90);
  });

  it("widens both label faces for a long class name, leaving the other sides alone", () => {
    const margin = matrixMargin(["Prophetic Reproach, Threat, and Admonition"]);
    expect(margin.l).toBeGreaterThan(200);
    expect(margin.b).toBeGreaterThan(150);
    expect(margin.b).toBeLessThan(margin.l);
    expect([margin.r, margin.t]).toEqual([130, 10]);
  });
});
