import type { GapStats } from "../model/types";

function formatP(p: number): string {
  return p < 0.001 ? "&lt; 0.001" : p.toFixed(3);
}

/** HTML for a permutation-test gap statistic, p-value color-coded significant (good) or not (warn). */
export function formatGapStatHTML(stats: GapStats): string {
  const sig = stats.p < 0.05;
  const cls = sig ? "good" : "warn";
  const note = sig ? "" : " (not significant)";
  return (
    `<span class="item"><span class="k">gap</span><span class="v">${stats.gap.toFixed(4)}</span></span>` +
    `<span class="item"><span class="k">effect size</span><span class="v">${stats.effect_size.toFixed(2)}</span></span>` +
    `<span class="item"><span class="k">p</span><span class="pill ${cls}">${formatP(stats.p)}${note}</span></span>`
  );
}

/** HTML for a bootstrapped scalar (AUC or AP) point estimate and its 95% BCa confidence interval. */
export function formatScalarStatHTML(
  label: string,
  point: number,
  ciLow: number,
  ciHigh: number,
): string {
  return (
    `<span class="item"><span class="k">${label}</span><span class="v">${point.toFixed(3)}</span></span>` +
    `<span class="item"><span class="k">95% ci</span><span class="v">[${ciLow.toFixed(3)}, ${ciHigh.toFixed(3)}]</span></span>`
  );
}
