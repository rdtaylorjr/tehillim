import { TOKENS } from "../model/tokens";

/** Plotly config shared by every chart: no mode bar, and resizing driven by the mount, not Plotly. */
export const PLOTLY_CONFIG = { displayModeBar: false, responsive: false };

/**
 * Layout fields shared by every chart on this route (panel colors, font, hover label), merged with
 * per-chart extras. Typed loosely (`Record<string, unknown>`, cast to `Partial<Layout>` at the
 * `Plotly.newPlot` call site) because @types/plotly.js 3.0.x doesn't yet type violin-trace layout
 * keys (`violinmode`, `violingap`) that plotly.js-dist-min 3.7.0 actually supports at runtime.
 */
export function baseLayout(extra: Record<string, unknown>): Record<string, unknown> {
  return {
    paper_bgcolor: TOKENS.bgPanel,
    plot_bgcolor: TOKENS.bgPanel,
    font: { family: TOKENS.sans, color: TOKENS.inkDim, size: 11 },
    margin: { l: 60, r: 20, t: 10, b: 50 },
    hoverlabel: {
      bgcolor: TOKENS.bgPanel,
      bordercolor: TOKENS.rule,
      font: { family: TOKENS.sans, color: TOKENS.ink, size: 12 },
    },
    ...extra,
  };
}
