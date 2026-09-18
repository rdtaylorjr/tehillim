import { facetFor } from "../corpus";
import type { BenchmarkId, FamilyId, ParallelismType, SourceId, TextVariant } from "../corpus";

/** "all" is the unset state of every filter, distinct from any value it could take. */
export const ALL = "all";
export type All = typeof ALL;

/** Everything the toolbar controls, in one serializable shape. */
export interface Selection {
  readonly family: FamilyId;
  readonly benchmark: BenchmarkId;
  readonly parallelismType: ParallelismType | All;
  /** Whose classification the genre benchmark is read against. */
  readonly source: SourceId;
  /** The source's unit register, or null for a source that classifies whole psalms. */
  readonly unit: string | null;
  /** One class of the register in view, or ALL. */
  readonly genre: string;
  readonly facet: string;
  readonly text: TextVariant | All;
  readonly query: string;
  /** The row the reader opened, or null while none has been chosen. */
  readonly model: string | null;
  /** Which pane is showing, held apart from `model` so a filter change keeps it. */
  readonly view: "table" | "detail";
}

export type SelectionAction =
  | { type: "family/selected"; family: FamilyId }
  | { type: "benchmark/selected"; benchmark: BenchmarkId }
  | { type: "parallelismType/selected"; parallelismType: ParallelismType | All }
  | { type: "source/selected"; source: SourceId }
  | { type: "unit/selected"; unit: string | null }
  | { type: "genre/selected"; genre: string }
  | { type: "facet/selected"; facet: string }
  | { type: "text/selected"; text: TextVariant | All }
  | { type: "query/changed"; query: string }
  | { type: "model/selected"; model: string | null }
  | { type: "view/selected"; view: Selection["view"] };

export const INITIAL_SELECTION: Selection = {
  family: "semantic",
  benchmark: "parallelism",
  parallelismType: "all",
  source: "gunkel",
  unit: null,
  genre: "all",
  facet: "all",
  text: "all",
  query: "",
  model: null,
  view: "table",
};

/** Families divided into units or levels get an extra selector for that division. */
export function showsFacet(family: FamilyId): boolean {
  return facetFor(family) !== undefined;
}

/** Only lexical's word models carry text variants, where semantic models carry them throughout. */
export function showsText(family: FamilyId, facet: string): boolean {
  if (family === "lexical") return facet === "word";
  return family === "semantic";
}

/** Reduces one toolbar interaction, cascading the resets its dependents require. */
export function selectionReducer(state: Selection, action: SelectionAction): Selection {
  switch (action.type) {
    case "family/selected": {
      if (action.family === state.family) return state;
      // Facet, text, query and the open model all belong to the outgoing family.
      return {
        ...state,
        family: action.family,
        facet: "all",
        text: "all",
        query: "",
        model: null,
      };
    }
    case "benchmark/selected": {
      if (action.benchmark === state.benchmark) return state;
      return { ...state, benchmark: action.benchmark };
    }
    case "parallelismType/selected": {
      if (action.parallelismType === state.parallelismType) return state;
      return { ...state, parallelismType: action.parallelismType };
    }
    case "source/selected": {
      if (action.source === state.source) return state;
      //: A class and a register belong to the outgoing source.
      return { ...state, source: action.source, unit: null, genre: "all" };
    }
    case "unit/selected": {
      if (action.unit === state.unit) return state;
      //: A class belongs to the register it was chosen under.
      return { ...state, unit: action.unit, genre: "all" };
    }
    case "genre/selected": {
      if (action.genre === state.genre) return state;
      return { ...state, genre: action.genre };
    }
    case "facet/selected": {
      if (action.facet === state.facet) return state;
      const text = showsText(state.family, action.facet) ? state.text : "all";
      return { ...state, facet: action.facet, text };
    }
    case "text/selected": {
      if (action.text === state.text) return state;
      return { ...state, text: action.text };
    }
    case "query/changed": {
      if (action.query === state.query) return state;
      return { ...state, query: action.query };
    }
    case "model/selected": {
      //: Only which model, never which view, which the View switch alone changes.
      if (action.model === state.model) return state;
      return { ...state, model: action.model };
    }
    case "view/selected": {
      if (action.view === state.view) return state;
      return { ...state, view: action.view };
    }
  }
}
