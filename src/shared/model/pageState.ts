import type { ReferenceColorMode } from "../lib/color";

export type ViewMode = "matrix" | "network";
export type ClusterViewMode = "alignment" | "scatter";

/** Opens on a psalm with legible similarity structure, the same on both pages. */
export const OPENING_PSALM = 23;

/** The page's state beside the method choice, which the toolbar's own reducer carries. */
export interface CompareState {
  selectedPsalm: number | null;
  view: ViewMode;
  referenceColorMode: ReferenceColorMode;
}

export type CompareAction =
  | { type: "SELECT_PSALM"; psalm: number | null }
  | { type: "SET_VIEW"; view: ViewMode }
  | { type: "SET_REFERENCE_COLOR_MODE"; mode: ReferenceColorMode };

export const INITIAL_COMPARE_STATE: CompareState = {
  selectedPsalm: OPENING_PSALM,
  view: "matrix",
  referenceColorMode: "book",
};

export function reduceCompare(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "SELECT_PSALM":
      return { ...state, selectedPsalm: action.psalm };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_REFERENCE_COLOR_MODE":
      return { ...state, referenceColorMode: action.mode };
  }
}

//: A separate reducer, since the two pages share only two fields.
export interface ClusterState {
  selectedPsalm: number | null;
  referenceColorMode: ReferenceColorMode;
  clusterView: ClusterViewMode;
}

export type ClusterAction =
  | { type: "SELECT_PSALM"; psalm: number | null }
  | { type: "SET_REFERENCE_COLOR_MODE"; mode: ReferenceColorMode }
  | { type: "SET_CLUSTER_VIEW"; view: ClusterViewMode };

export const INITIAL_CLUSTER_STATE: ClusterState = {
  selectedPsalm: OPENING_PSALM,
  //: Opens on Gunkel families, so the picker shows the ground truth being checked.
  referenceColorMode: "family",
  clusterView: "alignment",
};

export function reduceCluster(state: ClusterState, action: ClusterAction): ClusterState {
  switch (action.type) {
    case "SELECT_PSALM":
      return { ...state, selectedPsalm: action.psalm };
    case "SET_REFERENCE_COLOR_MODE":
      return { ...state, referenceColorMode: action.mode };
    case "SET_CLUSTER_VIEW":
      return { ...state, clusterView: action.view };
  }
}
