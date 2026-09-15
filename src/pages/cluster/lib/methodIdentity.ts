import { baseFeatureId, featureDisplay } from "../../../shared/lib/corpus";
import type { ClusterMethodPayload, CompareMethodMeta } from "../../../shared/model";

//: The clustering payload predates the compare index, so its ids are taken apart here.
const AGGREGATIONS = ["mean-pool", "soft-alignment"] as const;
const TEXTS = ["consonantal", "vocalized", "cantillation"] as const;
const CORRECTIONS = ["top-pc", "whitened"] as const;

const FAMILY_DOMAIN: Record<string, CompareMethodMeta["domain"]> = {
  Lexical: "lexical",
  Morphological: "morphological",
  Syntactic: "syntactic",
  Semantic: "semantic",
};

interface SemanticParts {
  readonly encoder: string;
  readonly aggregation: string;
  readonly text: string;
  readonly correction: string | null;
}

/** Parses `<encoder>-<aggregation>` with an optional text or correction tail. */
function parseSemantic(baseId: string): SemanticParts | null {
  for (const aggregation of AGGREGATIONS) {
    const at = baseId.lastIndexOf(`-${aggregation}`);
    if (at <= 0) continue;
    const encoder = baseId.slice(0, at);
    const tail = baseId.slice(at + aggregation.length + 2);
    if (tail === "") return { encoder, aggregation, text: "cantillation", correction: null };
    if ((TEXTS as readonly string[]).includes(tail)) {
      return { encoder, aggregation, text: tail, correction: null };
    }
    if ((CORRECTIONS as readonly string[]).includes(tail)) {
      return { encoder, aggregation, text: "cantillation", correction: tail };
    }
    return null;
  }
  return null;
}

/** One clustering method in the identity the compare index carries, read off its id. */
export function identityOfClusterMethod(method: ClusterMethodPayload): CompareMethodMeta {
  const baseId = baseFeatureId(method.id);
  const display = featureDisplay(baseId);
  const semantic = parseSemantic(baseId);
  if (semantic !== null) {
    return {
      id: method.id,
      description: method.description,
      domain: "semantic",
      representation: `${semantic.encoder}_${semantic.text}`,
      modelBase: semantic.encoder,
      textVariant: semantic.text,
      aggregation: semantic.aggregation,
      correction: semantic.correction,
    };
  }
  //: A corpus profile predates the representations, so its base id stands as one until it is rerun.
  return {
    id: method.id,
    description: method.description,
    domain: FAMILY_DOMAIN[display.family] ?? "lexical",
    representation: baseId,
    modelBase: baseId,
    textVariant: null,
    aggregation: "tfidf",
    correction: null,
  };
}
