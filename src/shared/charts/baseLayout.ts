import { TOKENS } from "./tokens";

/** Plotly config shared by every chart: no mode bar, and resizing driven by the mount, not Plotly. */
export const PLOTLY_CONFIG = { displayModeBar: false, responsive: false };

/** Layout shared by every chart here, typed loosely since violin keys are untyped. */
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
