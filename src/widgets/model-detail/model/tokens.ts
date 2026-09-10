/** Literal hex colors for Plotly traces, matching the site's palette in src/index.css. */
export const TOKENS = {
  ink: "#e8e9eb",
  inkDim: "#9a9ea5",
  inkFaint: "#6b6f76",
  rule: "#2c3036",
  accent: "#7ba3d9",
  accentDim: "#5580b3",
  bgPanel: "#1a1d21",
  bgInset: "#23272c",
  good: "#7fb894",
  warn: "#d1ab5c",
  bad: "#d18178",
  heatmapNeg: "#306381",
  heatmapNegMid: "#2d7966",
  heatmapPosMid: "#8f743a",
  heatmapPos: "#86413e",
  trajWithin: "#3981aa",
  trajAcross: "#c19a44",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace",
} as const;

/** The Okabe and Ito palette retuned to this site's register, closest pair at dE 14. */
export const GENRE_COLORS: Record<string, string> = {
  Hymn: "#c19a44",
  Lament: "#6faccf",
  Praise: "#35a083",
  Royal: "#3981aa",
  Thanksgiving: "#bb753e",
  Trust: "#c85a5a",
  Wisdom: "#cdc669",
};

/** Five of the same seven hues, ordered to match the canonical type order. */
export const PARALLELISM_TYPE_COLORS: Record<string, string> = {
  Synonymous: "#c19a44",
  Antithetic: "#6faccf",
  Synthetic: "#35a083",
  Emblematic: "#3981aa",
  Staircase: "#bb753e",
};

/** One diverging scale for every matrix, four hues in steps so a cell reads as a band rather than a shade. */
/* The four are the categorical hues muted against the panel, so a full matrix does not outshout the charts around it. */
export const DIVERGING_COLORSCALE: [number, string][] = [
  [0, TOKENS.heatmapNeg],
  [0.25, TOKENS.heatmapNeg],
  [0.25, TOKENS.heatmapNegMid],
  [0.5, TOKENS.heatmapNegMid],
  [0.5, TOKENS.heatmapPosMid],
  [0.75, TOKENS.heatmapPosMid],
  [0.75, TOKENS.heatmapPos],
  [1, TOKENS.heatmapPos],
];
