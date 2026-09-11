import { BOOK_HUES, FAMILY_HUES } from "../lib/color";

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
  heatmapNeg: BOOK_HUES[0] ?? "",
  heatmapNegMid: BOOK_HUES[2] ?? "",
  heatmapPosMid: BOOK_HUES[3] ?? "",
  heatmapPos: BOOK_HUES[4] ?? "",
  trajWithin: "#5b9bea",
  trajAcross: "#e8b53a",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace",
} as const;

//: Read from the picker's own scales, so a chart can never drift from the colour a psalm wears.
const [FAMILY_HYMN, FAMILY_LAMENT, FAMILY_ROYAL, FAMILY_THANKS, FAMILY_WISDOM, FAMILY_MINOR] =
  FAMILY_HUES;
const BOOK_PRAISE = BOOK_HUES[2];

/** The families keep the hue the cluster page gives them, and the two genres that are not families take the rest. */
export const GENRE_COLORS: Record<string, string> = {
  Hymn: FAMILY_HYMN ?? "",
  Lament: FAMILY_LAMENT ?? "",
  Praise: BOOK_PRAISE ?? "",
  Royal: FAMILY_ROYAL ?? "",
  Thanksgiving: FAMILY_THANKS ?? "",
  Trust: FAMILY_MINOR ?? "",
  Wisdom: FAMILY_WISDOM ?? "",
};

/** Five of the same seven hues, ordered to match the canonical type order. */
export const PARALLELISM_TYPE_COLORS: Record<string, string> = {
  Synonymous: FAMILY_HYMN ?? "",
  Antithetic: FAMILY_LAMENT ?? "",
  Synthetic: BOOK_PRAISE ?? "",
  Emblematic: FAMILY_ROYAL ?? "",
  Staircase: FAMILY_THANKS ?? "",
};

/** Repeats each color across its own band, since Plotly steps between stops rather than holding one. */
export function steppedColorscale(colors: readonly string[]): [number, string][] {
  if (colors.length === 0) {
    throw new RangeError("steppedColorscale: at least one color is needed to make a ramp");
  }
  return colors.flatMap((color, index) => [
    [index / colors.length, color] as [number, string],
    [(index + 1) / colors.length, color] as [number, string],
  ]);
}

/** The same banding as a lookup, for a renderer that asks for one value's color rather than a ramp. */
export function steppedColorFn(
  colors: readonly string[],
  max: number,
): (value: number) => string {
  if (colors.length === 0) {
    throw new RangeError("steppedColorFn: at least one color is needed to make a ramp");
  }
  if (max <= 0) {
    throw new RangeError(`steppedColorFn: max must be positive, got ${String(max)}`);
  }
  return (value) => {
    const position = Math.min(Math.max(value / max, 0), 1);
    const index = Math.min(Math.floor(position * colors.length), colors.length - 1);
    return colors[index] ?? "";
  };
}

/** Every matrix reads in these four bands, the book hues with the orange left out so the ramp runs cool to warm. */
export const HEATMAP_STEPS: readonly string[] = [
  TOKENS.heatmapNeg,
  TOKENS.heatmapNegMid,
  TOKENS.heatmapPosMid,
  TOKENS.heatmapPos,
];

/** The same four bands read as a diverging scale, the midpoint falling between the cool and warm pair. */
export const DIVERGING_COLORSCALE: [number, string][] = steppedColorscale(HEATMAP_STEPS);
