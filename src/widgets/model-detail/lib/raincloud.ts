/** Below this sample size a KDE misrepresents a sparse distribution as smooth (plan's statistician-audit floor). */
export const MIN_N_FOR_DENSITY = 25;

/** Whether a group's raincloud trace falls back to raw-points-only, and its axis row label. */
export function raincloudRowLabel(group: { label: string; n: number }): {
  thin: boolean;
  y0: string;
} {
  const thin = group.n < MIN_N_FOR_DENSITY;
  const y0 = thin
    ? `${group.label} (n=${String(group.n)}) · raw only, n<${String(MIN_N_FOR_DENSITY)}`
    : `${group.label} (n=${String(group.n)})`;
  return { thin, y0 };
}
