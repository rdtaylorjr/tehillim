/** Whether a data-chosen k reads as settled, from the fraction of subsamples agreeing. */

export type KStabilityLevel = "high" | "moderate" | "low";

export interface KStabilityConfidence {
  level: KStabilityLevel;
  message: string;
}

/** Below this fraction agreeing, the chosen k is close to a coin flip. */
const LOW_STABILITY_THRESHOLD = 0.4;

/** At or above this fraction, the chosen k is well supported. */
const HIGH_STABILITY_THRESHOLD = 0.7;

/** Null where k was not data-driven, since there is nothing to report. */
export function describeKStability(
  nClusters: number,
  stability: number | null | undefined,
): KStabilityConfidence | null {
  //: Absent reads as null, so an older payload never prints as NaN.
  if (stability === null || stability === undefined || !Number.isFinite(stability)) return null;

  const percent = Math.round(stability * 100);

  if (stability < LOW_STABILITY_THRESHOLD) {
    return {
      level: "low",
      message: `This signal's cluster count (k=${String(nClusters)}) was chosen by silhouette score, but agreed with resampling only ${String(percent)}% of the time (close to a coin flip). Read this k as unsettled, not a fixed fact about the signal.`,
    };
  }

  if (stability < HIGH_STABILITY_THRESHOLD) {
    return {
      level: "moderate",
      message: `This signal's cluster count (k=${String(nClusters)}) was chosen by silhouette score and agreed with resampling ${String(percent)}% of the time (a moderately stable choice).`,
    };
  }

  return {
    level: "high",
    message: `This signal's cluster count (k=${String(nClusters)}) was chosen by silhouette score and agreed with resampling ${String(percent)}% of the time.`,
  };
}
