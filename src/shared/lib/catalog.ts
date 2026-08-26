/** A family of models, named for the linguistic level its representation encodes. */
export interface ModelFamily {
  readonly id: FamilyId;
  readonly label: string;
  /** False where no benchmark has been run for the family yet, so its result set is empty. */
  readonly hasData: boolean;
}

export type FamilyId =
  "semantic" | "lexical" | "phonology" | "morphology" | "syntax" | "discourse";

export type BenchmarkId = "parallelism" | "genre";

/** A family-specific sub-division of its models, shown as an extra selector. */
export interface Facet {
  readonly label: string;
  readonly values: readonly string[];
}

export const MODEL_FAMILIES: readonly ModelFamily[] = [
  { id: "semantic", label: "Semantic", hasData: true },
  { id: "lexical", label: "Lexical", hasData: true },
  { id: "phonology", label: "Phonology", hasData: false },
  { id: "morphology", label: "Morphology", hasData: true },
  { id: "syntax", label: "Syntax", hasData: true },
  { id: "discourse", label: "Discourse", hasData: false },
];

export const BENCHMARKS: readonly { readonly id: BenchmarkId; readonly label: string }[] = [
  { id: "parallelism", label: "Parallelism" },
  { id: "genre", label: "Genre" },
];

const FACETS: Partial<Record<FamilyId, Facet>> = {
  lexical: { label: "Unit", values: ["homograph", "lexeme", "word"] },
  syntax: { label: "Level", values: ["clause", "phrase"] },
};

/** Canonical scholarly ordering, which is not alphabetical. */
export type ParallelismType = (typeof PARALLELISM_TYPES)[number];

export const PARALLELISM_TYPES = [
  "Synonymous",
  "Antithetic",
  "Synthetic",
  "Emblematic",
  "Staircase",
] as const;

export type TrajectoryMetric = (typeof TRAJECTORY_METRICS)[number];

export const TRAJECTORY_METRICS = [
  "content_distance",
  "structural_distance",
  "step_magnitude_distance",
  "turning_angle_distance",
] as const;

export type Genre = (typeof GENRES)[number];

export const GENRES = [
  "Hymn",
  "Lament",
  "Praise",
  "Royal",
  "Thanksgiving",
  "Trust",
  "Wisdom",
] as const;

export type TextVariant = (typeof TEXT_VARIANTS)[number];

export const TEXT_VARIANTS = ["consonantal", "vocalized", "cantillation"] as const;

/** The family's sub-division, or undefined where the family has none. */
export function facetFor(family: FamilyId): Facet | undefined {
  return FACETS[family];
}

/** The facet value a model name belongs to, matching an exact name or a `${value}_` prefix. */
export function facetOf(modelBase: string, values: readonly string[]): string | null {
  for (const value of values) {
    if (modelBase === value || modelBase.startsWith(`${value}_`)) return value;
  }
  return null;
}

/** The family record for an id, which the FamilyId union guarantees exists. */
export function familyFor(family: FamilyId): ModelFamily {
  const found = MODEL_FAMILIES.find((f) => f.id === family);
  if (!found) throw new Error(`Unknown model family: ${family}`);
  return found;
}

/** Turns a snake_case value into a title-cased label, for names of the statistics themselves. */
export function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Turns a snake_case value into a capitalized, space-separated option label. */
export function sentenceCase(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
