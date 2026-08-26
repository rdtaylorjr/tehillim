/** Literal hex colors for Plotly traces, matching the site's palette (template_home.html's CSS custom properties). */
export const TOKENS = {
  ink: "#e8e9eb",
  inkDim: "#9a9ea5",
  inkFaint: "#6b6f76",
  rule: "#2c3036",
  accent: "#7ba3d9",
  accentDim: "#5580b3",
  bgPanel: "#1a1d21",
  bgInset: "#23272c",
  good: "#4ade80",
  warn: "#fbbf24",
  bad: "#f87171",
  heatmapNeg: "#4d94d4",
  heatmapPos: "#e37a2e",
  trajWithin: "#4d94d4",
  trajAcross: "#e6a93c",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace",
} as const;

/** Colorblind-safe qualitative palette (Okabe & Ito 2008), brightened from the reference values for legibility against a near-black ground. */
export const GENRE_COLORS: Record<string, string> = {
  Hymn: "#e6a93c",
  Lament: "#6fc1f0",
  Praise: "#2bb894",
  Royal: "#4d94d4",
  Thanksgiving: "#e37a2e",
  Trust: "#dd93bd",
  Wisdom: "#e8d44d",
};

/** Same colorblind-safe palette family, five of the seven hues, ordered to match the canonical type order. */
export const PARALLELISM_TYPE_COLORS: Record<string, string> = {
  Synonymous: "#e6a93c",
  Antithetic: "#6fc1f0",
  Synthetic: "#2bb894",
  Emblematic: "#4d94d4",
  Staircase: "#e37a2e",
};

/** One diverging scale for every matrix on the page: negative cool blue, positive warm gold, zero at the panel background. */
export const DIVERGING_COLORSCALE: [number, string][] = [
  [0, TOKENS.heatmapNeg],
  [0.5, TOKENS.bgPanel],
  [1, TOKENS.heatmapPos],
];
