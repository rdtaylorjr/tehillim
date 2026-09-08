/** Whether a scatter plot's positions and hulls should be read as trustworthy. */

export type ScatterConfidenceLevel = "low" | "moderate" | "good";

export interface ScatterConfidence {
  level: ScatterConfidenceLevel;
  message: string;
}

/** Below this share captured in 2D, positions and hulls need a caveat. */
const LOW_STRUCTURE_THRESHOLD = 0.4;

/** AMI or ARI this close to zero reads as no better than a random partition. */
const NEAR_ZERO_THRESHOLD = 0.05;

export function describeScatterConfidence(
  structureCaptured: number | null | undefined,
  ami: number,
  ari: number,
): ScatterConfidence {
  //: An older payload carries no structure share, so the layout claim is dropped.
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

/** What can be said with no structure share: whether the partition beats random. */
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
