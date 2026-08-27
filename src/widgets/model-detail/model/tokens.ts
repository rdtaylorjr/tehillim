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
  heatmapNeg: "#3981aa",
  heatmapPos: "#bb753e",
  trajWithin: "#3981aa",
  trajAcross: "#c19a44",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace",
} as const;

/**
 * Okabe & Ito (2008) qualitative palette, retuned to the site's register: saturation capped at the
 * level index.css uses, lightness pulled toward it while keeping the spread that separates the two
 * blues. Closest pair sits at CIE ΔE 17.
 */
export const GENRE_COLORS: Record<string, string> = {
  Hymn: "#c19a44",
  Lament: "#6faccf",
  Praise: "#35a083",
  Royal: "#3981aa",
  Thanksgiving: "#bb753e",
  Trust: "#cb77a6",
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

/** One diverging scale for every matrix: negative cool blue, positive warm ochre, zero at the panel. */
export const DIVERGING_COLORSCALE: [number, string][] = [
  [0, TOKENS.heatmapNeg],
  [0.5, TOKENS.bgPanel],
  [1, TOKENS.heatmapPos],
];
