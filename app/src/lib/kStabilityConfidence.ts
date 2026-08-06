/**
 * Whether a signal's data-chosen cluster count (k) should be read as
 * settled or as a knife-edge pick - silhouette score alone reports a
 * single winning k with no sense of how easily a different subsample of
 * the corpus could have picked a different one. `kStability` (see
 * pipeline/k_selection.py's `subsample_k_stability`) answers that
 * directly: the fraction of subsamples (drawn without replacement, so a
 * psalm is never trivially self-similar with itself the way a
 * with-replacement bootstrap would allow) whose own silhouette sweep
 * agreed with the k chosen on the full corpus. See the top-level
 * README's "Statistical validation methodology" section for the current
 * per-signal figures.
 *
 * Deliberately not paired with a partition-significance p-value here -
 * that diagnostic (see the same README section) saturates near the
 * permutation floor for every signal it applies to, so surfacing it as a
 * headline confidence claim would overstate what it actually shows. It
 * also doesn't apply at all once a signal's cluster count is 1 (the gap
 * statistic found no real structure - see `k_selection.gap_statistic`) -
 * there's no multi-cluster partition left to diagnose the stability of.
 */

export type KStabilityLevel = "high" | "moderate" | "low";

export interface KStabilityConfidence {
  level: KStabilityLevel;
  message: string;
}

/** Below this fraction of subsamples agreeing, the chosen k is close to
 * a coin flip and should be read with real caution. */
const LOW_STABILITY_THRESHOLD = 0.4;

/** At or above this fraction, the chosen k is well-supported across
 * subsamples. */
const HIGH_STABILITY_THRESHOLD = 0.7;

/** `stability` is `null` when this cluster count wasn't data-driven at
 * all (a `fixed_k`-configured method) - there's nothing to report, so
 * this returns `null` rather than a confidence level. */
export function describeKStability(
  nClusters: number,
  stability: number | null,
): KStabilityConfidence | null {
  if (stability === null) return null;

  const percent = Math.round(stability * 100);

  if (stability < LOW_STABILITY_THRESHOLD) {
    return {
      level: "low",
      message: `This signal's cluster count (k=${nClusters}) was chosen by silhouette score, but agreed with resampling only ${percent}% of the time (close to a coin flip). Read this k as unsettled, not a fixed fact about the signal.`,
    };
  }

  if (stability < HIGH_STABILITY_THRESHOLD) {
    return {
      level: "moderate",
      message: `This signal's cluster count (k=${nClusters}) was chosen by silhouette score and agreed with resampling ${percent}% of the time (a moderately stable choice).`,
    };
  }

  return {
    level: "high",
    message: `This signal's cluster count (k=${nClusters}) was chosen by silhouette score and agreed with resampling ${percent}% of the time.`,
  };
}
