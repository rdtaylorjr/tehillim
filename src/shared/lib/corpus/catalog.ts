/** A family of models, named for the linguistic level its representation encodes. */
export interface ModelFamily {
  readonly id: FamilyId;
  readonly label: string;
  /** False where no benchmark has been run for the family yet, so its result set is empty. */
  readonly hasData: boolean;
}

export type FamilyId = "phonological" | "morphological" | "lexical" | "syntactic" | "semantic";

export type BenchmarkId = "parallelism" | "genre";

/** A family-specific sub-division of its models, shown as an extra selector. */
export interface Facet {
  readonly label: string;
  readonly values: readonly string[];
}

/** The levels of linguistic description in order, named as adjectives throughout. */
export const MODEL_FAMILIES: readonly ModelFamily[] = [
  { id: "phonological", label: "Phonological", hasData: false },
  { id: "morphological", label: "Morphological", hasData: true },
  { id: "lexical", label: "Lexical", hasData: true },
  { id: "syntactic", label: "Syntactic", hasData: true },
  { id: "semantic", label: "Semantic", hasData: true },
];

export const BENCHMARKS: readonly { readonly id: BenchmarkId; readonly label: string }[] = [
  { id: "parallelism", label: "Parallelism" },
  { id: "genre", label: "Genre" },
];

const FACETS: Partial<Record<FamilyId, Facet>> = {
  lexical: { label: "Type", values: ["homograph", "lexeme", "word"] },
  syntactic: { label: "Level", values: ["phrase", "clause"] },
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

export type SourceId = (typeof SOURCES)[number]["id"];

/** Whose classification a genre benchmark scores against, and what that source calls a class. */
export const SOURCES = [
  { id: "gunkel", label: "Gunkel", category: "Gattung" },
  { id: "logos", label: "Logos", category: "Genre" },
] as const;

/** The source record for an id, which the SourceId union guarantees exists. */
export function sourceFor(source: SourceId): (typeof SOURCES)[number] {
  const found = SOURCES.find((s) => s.id === source);
  if (!found) throw new Error(`Unknown source: ${source}`);
  return found;
}

/** Gunkel's words for the units of assignment, keyed as the export names them. */
const UNIT_NAMES: Record<string, string> = { song: "Lied", component: "Stück", motif: "Motiv" };

/** A unit register as the site names it: the units it counts, in Gunkel's words, as a list. */
export function unitLabel(unit: string): string {
  return unit
    .split("_")
    .map((part) => UNIT_NAMES[part] ?? sentenceCase(part))
    .join(", ");
}

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
