import { MODEL_FAMILIES, facetFor, facetOf, titleCase } from "../corpus";
import type { FamilyId, ModelFamily } from "../corpus";
import type { CompareMethodMeta } from "../../model/types";
import { ALL, INITIAL_SELECTION, selectionReducer } from "./selection";
import type { Selection, SelectionAction } from "./selection";
import type { SelectOption } from "../../ui/SelectControl";

/** The correction axis's value for a method scored without one. */
export const NO_CORRECTION = "none";

/** The two axes a compare method carries beyond the toolbar's selection. */
export interface MethodAxes {
  readonly aggregation: string;
  readonly correction: string;
}

/** One method as the toolbar picks it: the family filters, then the model, then its axes. */
export interface MethodChoice {
  readonly selection: Selection;
  readonly axes: MethodAxes;
}

export type MethodChoiceAction =
  | SelectionAction
  | { type: "aggregation/selected"; aggregation: string }
  | { type: "correction/selected"; correction: string };

/** Reduces one dropdown interaction, the toolbar's selection through its own reducer. */
export function methodChoiceReducer(
  state: MethodChoice,
  action: MethodChoiceAction,
): MethodChoice {
  if (action.type === "aggregation/selected") {
    return { ...state, axes: { ...state.axes, aggregation: action.aggregation } };
  }
  if (action.type === "correction/selected") {
    return { ...state, axes: { ...state.axes, correction: action.correction } };
  }
  return { ...state, selection: selectionReducer(state.selection, action) };
}

//: A naming table, never a gate: a value it lacks is still offered, capitalized by rule.
const AXIS_LABELS: Record<string, string> = { "top-pc": "Top PC" };

/** An axis value as its option reads: its initialism kept, else every word capitalized. */
export function axisLabel(value: string): string {
  return AXIS_LABELS[value] ?? titleCase(value.replace(/-/g, "_"));
}

/** The axes a method carries as the toggle names them, in the order the dropdown asks them. */
export function axisLabels(method: CompareMethodMeta): string[] {
  return [method.aggregation, ...(method.correction === null ? [] : [method.correction])].map(
    axisLabel,
  );
}

/** The families the methods cover, in catalog order, for the pills to offer. */
export function methodFamilies(methods: readonly CompareMethodMeta[]): readonly ModelFamily[] {
  const present = new Set(methods.map((m) => m.domain));
  return MODEL_FAMILIES.filter((f) => present.has(f.id));
}

/** The type or level a method's model name carries, as the benchmark's rows are bucketed. */
export function facetOfMethod(method: CompareMethodMeta): string | null {
  const facet = facetFor(method.domain as FamilyId);
  return facet === undefined ? null : facetOf(method.modelBase, facet.values);
}

/** The benchmark's row filters: the family, then its facet and text variant where not "all". */
function matchesFilters(
  method: CompareMethodMeta,
  selection: Pick<Selection, "family" | "facet" | "text">,
): boolean {
  if (method.domain !== selection.family) return false;
  if (selection.facet !== ALL && facetOfMethod(method) !== selection.facet) return false;
  return selection.text === ALL || method.textVariant === selection.text;
}

/** One entry per representation, named as the benchmark's detail names it, in name order. */
function modelOptions(methods: readonly CompareMethodMeta[]): SelectOption[] {
  const representations = [...new Set(methods.map((m) => m.representation))].sort((a, b) =>
    a.localeCompare(b),
  );
  return representations.map((value) => ({ value, label: value }));
}

export interface MethodResolution {
  /** The method the choice lands on, or null when the family holds none. */
  readonly method: CompareMethodMeta | null;
  /** The model the choice settled on, the asked-for one where the axes above admit it. */
  readonly model: string | null;
  /** The aggregations the filters admit, the correction each row narrowing the next. */
  readonly aggregations: readonly string[];
  readonly corrections: readonly string[];
  readonly models: readonly SelectOption[];
}

/** The value asked for where the data has it, otherwise the first it does have. */
function settle(options: readonly string[], wanted: string): string | null {
  if (options.includes(wanted)) return wanted;
  return options[0] ?? null;
}

/** The distinct values in sorted order, the given one first where present. */
function axisValues(values: readonly string[], first: string): string[] {
  const rest = [...new Set(values)].filter((value) => value !== first).sort();
  return values.includes(first) ? [first, ...rest] : rest;
}

/** Resolves a choice to one method: the filters, then aggregation, correction, and model in turn. */
export function resolveMethod(
  methods: readonly CompareMethodMeta[],
  choice: MethodChoice,
): MethodResolution {
  const admitted = methods.filter((m) => matchesFilters(m, choice.selection));
  const aggregations = [...new Set(admitted.map((m) => m.aggregation))].sort();
  const aggregation = settle(aggregations, choice.axes.aggregation) ?? "";
  const ofAggregation = admitted.filter((m) => m.aggregation === aggregation);
  const corrections = axisValues(
    ofAggregation.map((m) => m.correction ?? NO_CORRECTION),
    NO_CORRECTION,
  );
  const correction = settle(corrections, choice.axes.correction) ?? NO_CORRECTION;
  const ofCorrection = ofAggregation.filter(
    (m) => (m.correction ?? NO_CORRECTION) === correction,
  );
  const models = modelOptions(ofCorrection);
  const model = settle(
    models.map((m) => m.value),
    choice.selection.model ?? "",
  );
  const method = ofCorrection.find((m) => m.representation === model) ?? null;
  return { method, model, aggregations, corrections, models };
}

/** The choice a method stands for, for opening a page on it. */
export function choiceOfMethod(method: CompareMethodMeta): MethodChoice {
  return {
    selection: {
      ...INITIAL_SELECTION,
      family: method.domain as FamilyId,
      model: method.representation,
    },
    axes: {
      aggregation: method.aggregation,
      correction: method.correction ?? NO_CORRECTION,
    },
  };
}
