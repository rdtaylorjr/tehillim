import { facetFor } from "./catalog";
import type {
  BenchmarkId,
  FamilyId,
  Genre,
  ParallelismType,
  TextVariant,
  TrajectoryMetric,
} from "./catalog";

/** "all" is the unset state of every filter, distinct from any value it could take. */
export const ALL = "all";
export type All = typeof ALL;

/** The genre benchmark reports discrimination, or one of the trajectory metrics. */
export type Metric = "genre" | TrajectoryMetric;

/** Everything the toolbar controls, in one serializable shape. */
export interface Selection {
  readonly family: FamilyId;
  readonly benchmark: BenchmarkId;
  readonly parallelismType: ParallelismType | All;
  readonly genre: Genre | All;
  readonly metric: Metric;
  readonly facet: string;
  readonly text: TextVariant | All;
  readonly query: string;
  /** Whether the two branch rows are folded away behind the path. */
  readonly collapsed: boolean;
  /** The row the reader opened, or null while none has been chosen. */
  readonly model: string | null;
}

export type SelectionAction =
  | { type: "family/selected"; family: FamilyId }
  | { type: "benchmark/selected"; benchmark: BenchmarkId }
  | { type: "parallelismType/selected"; parallelismType: ParallelismType | All }
  | { type: "genre/selected"; genre: Genre | All }
  | { type: "metric/selected"; metric: Metric }
  | { type: "facet/selected"; facet: string }
  | { type: "text/selected"; text: TextVariant | All }
  | { type: "collapsed/toggled" }
  | { type: "query/changed"; query: string }
  | { type: "model/selected"; model: string | null };

export const INITIAL_SELECTION: Selection = {
  family: "semantic",
  benchmark: "parallelism",
  parallelismType: "all",
  genre: "all",
  metric: "genre",
  facet: "all",
  text: "all",
  query: "",
  collapsed: false,
  model: null,
};

/** Families divided into units or levels get an extra selector for that division. */
export function showsFacet(family: FamilyId): boolean {
  return facetFor(family) !== undefined;
}

/** Only lexical's word models carry text variants; semantic's carry them throughout. */
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
    case "genre/selected": {
      if (action.genre === state.genre) return state;
      return { ...state, genre: action.genre };
    }
    case "metric/selected": {
      if (action.metric === state.metric) return state;
      return { ...state, metric: action.metric };
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
    case "collapsed/toggled": {
      return { ...state, collapsed: !state.collapsed };
    }
    case "query/changed": {
      if (action.query === state.query) return state;
      return { ...state, query: action.query };
    }
    case "model/selected": {
      if (action.model === state.model) return state;
      return { ...state, model: action.model };
    }
  }
}
