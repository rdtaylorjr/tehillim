/**
 * Whether a scatter plot's own visuals (point positions, hull boundaries)
 * should be read as trustworthy - a chart can look clean while carrying
 * almost no real signal (a partition statistically indistinguishable from
 * a random one), or look chaotic while still being a faithful projection.
 * Nothing about the chart's visual quality warns of that on its own, so
 * this makes the check explicit rather than leaving "looks clean" and "is
 * real" silently decoupled. `structureCaptured` (see
 * pipeline/embedding.py's spectral-embedding docstring) is the fraction of
 * cluster-relevant spectral structure the 2D layout actually shows, not
 * classical MDS's "percent variance explained" - deliberately the same
 * eigenspace the clustering algorithm itself partitions, so a low value
 * here means the plotted axes are a small slice of what the algorithm
 * actually used, not an unrelated projection quality issue.
 */

export type ScatterConfidenceLevel = "low" | "moderate" | "good";

export interface ScatterConfidence {
  level: ScatterConfidenceLevel;
  message: string;
}

/** Below this fraction of cluster-relevant structure captured in 2D, hull
 * boundaries and point positions are approximate enough to caveat even
 * when the underlying partition is real. */
const LOW_STRUCTURE_THRESHOLD = 0.4;

/** AMI/ARI this close to 0 read as "no better than a random partition of
 * the same sizes" - not a hard significance test, but a plain-language
 * flag pointing at the same real numbers on the Genre Alignment tab. */
const NEAR_ZERO_THRESHOLD = 0.05;

export function describeScatterConfidence(
  structureCaptured: number | null | undefined,
  ami: number,
  ari: number,
): ScatterConfidence {
  // A payload generated before this diagnostic existed carries no structure
  // share. The AMI/ARI reading below stands on its own, so the layout claim is
  // dropped rather than printed as NaN.
  const known =
    structureCaptured !== null &&
    structureCaptured !== undefined &&
    Number.isFinite(structureCaptured);
  if (!known) return describeWithoutStructureShare(ami, ari);

  const share = structureCaptured;
  const percent = Math.round(share * 100);
  const lowStructure = share < LOW_STRUCTURE_THRESHOLD;
  const noStructure = ami < NEAR_ZERO_THRESHOLD && ari < NEAR_ZERO_THRESHOLD;

  if (noStructure) {
    const structureNote = `its clusters aren't statistically distinguishable from a random partition (AMI ${ami.toFixed(2)}, ARI ${ari.toFixed(2)})`;
    return lowStructure
      ? {
          level: "low",
          message: `This 2D layout captures only ${String(percent)}% of this signal's cluster-relevant structure, and ${structureNote}. Read this chart's shapes with real skepticism.`,
        }
      : {
          level: "low",
          message: `This 2D layout captures ${String(percent)}% of this signal's cluster-relevant structure, but ${structureNote}.`,
        };
  }

  if (lowStructure) {
    return {
      level: "moderate",
      message: `This 2D layout captures only ${String(percent)}% of this signal's cluster-relevant structure. Treat exact point positions and hull boundaries as approximate.`,
    };
  }

  return {
    level: "good",
    message: `This 2D layout captures ${String(percent)}% of this signal's cluster-relevant structure.`,
  };
}

/** What can still be said when the 2D layout's structure share is absent from
 * the payload: whether the partition itself is distinguishable from a random
 * one, and nothing about how faithfully the chart projects it. */
function describeWithoutStructureShare(ami: number, ari: number): ScatterConfidence {
  if (ami < NEAR_ZERO_THRESHOLD && ari < NEAR_ZERO_THRESHOLD) {
    return {
      level: "low",
      message: `This signal's clusters aren't statistically distinguishable from a random partition (AMI ${ami.toFixed(2)}, ARI ${ari.toFixed(2)}). Read this chart's shapes with real skepticism.`,
    };
  }
  return {
    level: "moderate",
    message: `How much of this signal's cluster-relevant structure the 2D layout captures wasn't recorded in this payload, so treat exact point positions and hull boundaries as approximate (AMI ${ami.toFixed(2)}, ARI ${ari.toFixed(2)}).`,
  };
}
