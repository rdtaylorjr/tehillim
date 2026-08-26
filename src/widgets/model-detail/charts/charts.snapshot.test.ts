import { describe, expect, it } from "vitest";
import { mountRainclouds } from "./rainclouds";
import { mountMultiCurve } from "./curves";
import { mountHeatmap, mountGenreMeanMatrix } from "./heatmap";
import type { PlotFn } from "./plot";
import type {
  CurveSeries,
  GenreMeanCell,
  HeatmapCell,
  PsalmOrderEntry,
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
const ORDER: PsalmOrderEntry[] = [
  { psalm: 1, genre: "Wisdom" },
  { psalm: 2, genre: "Royal" },
  { psalm: 3, genre: "Royal" },
];
const CELLS: HeatmapCell[] = [
  { psalm_a: 1, psalm_b: 2, value: 0.4 },
  { psalm_a: 2, psalm_b: 3, value: -0.2 },
  { psalm_a: 1, psalm_b: 3, value: 0.9 },
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
