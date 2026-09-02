import type { ReferenceColorMode } from "../lib/referenceColor";

export type ViewMode = "matrix" | "network";
export type ClusterViewMode = "alignment" | "scatter";

/** Opens on a psalm with rich, legible similarity structure - the same choice
 * on both pages, for a consistent first impression. */
export const OPENING_PSALM = 23;

export interface CompareState {
  selectedPsalm: number | null;
  selectedMethodId: string;
  view: ViewMode;
  referenceColorMode: ReferenceColorMode;
}

export type CompareAction =
  | { type: "SELECT_PSALM"; psalm: number | null }
  | { type: "SET_METHOD"; methodId: string }
  | { type: "SET_VIEW"; view: ViewMode }
  | { type: "SET_REFERENCE_COLOR_MODE"; mode: ReferenceColorMode };

/** The default method id comes from the fetched payload, not a hardcoded guess,
 * so the initial state is built once that payload has arrived. */
export function initialCompareState(defaultMethodId: string): CompareState {
  return {
    selectedPsalm: OPENING_PSALM,
    selectedMethodId: defaultMethodId,
    view: "matrix",
    referenceColorMode: "book",
  };
}

export function reduceCompare(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "SELECT_PSALM":
      return { ...state, selectedPsalm: action.psalm };
    case "SET_METHOD":
      return { ...state, selectedMethodId: action.methodId };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_REFERENCE_COLOR_MODE":
      return { ...state, referenceColorMode: action.mode };
  }
}

//: The Cluster page's own state - deliberately a separate, smaller reducer
//: rather than a generic parameterization of the Compare one: the two pages'
//: state shapes only share "selectedPsalm" and "referenceColorMode," and
//: forcing a shared generic abstraction over that overlap would be more
//: machinery than the actual duplication (a few lines) justifies.
export interface ClusterState {
  selectedPsalm: number | null;
  selectedClusterMethodId: string;
  referenceColorMode: ReferenceColorMode;
  clusterView: ClusterViewMode;
}

export type ClusterAction =
  | { type: "SELECT_PSALM"; psalm: number | null }
  | { type: "SET_CLUSTER_METHOD"; methodId: string }
  | { type: "SET_REFERENCE_COLOR_MODE"; mode: ReferenceColorMode }
  | { type: "SET_CLUSTER_VIEW"; view: ClusterViewMode };

export function initialClusterState(defaultClusterMethodId: string): ClusterState {
  return {
    selectedPsalm: OPENING_PSALM,
    selectedClusterMethodId: defaultClusterMethodId,
    // Unlike Compare, this page's whole point is genre recovery - opening
    // colored by Gunkel's 6 families (rather than Books) makes the picker
    // itself already show the ground truth the clustering is being checked
    // against.
    referenceColorMode: "family",
    clusterView: "alignment",
  };
}

export function reduceCluster(state: ClusterState, action: ClusterAction): ClusterState {
  switch (action.type) {
    case "SELECT_PSALM":
      return { ...state, selectedPsalm: action.psalm };
    case "SET_CLUSTER_METHOD":
      return { ...state, selectedClusterMethodId: action.methodId };
    case "SET_REFERENCE_COLOR_MODE":
      return { ...state, referenceColorMode: action.mode };
    case "SET_CLUSTER_VIEW":
      return { ...state, clusterView: action.view };
  }
}
