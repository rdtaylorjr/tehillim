//: The Cluster page's own minimal state - deliberately a separate, smaller
//: reducer/store rather than a generic parameterization of store.ts's
//: Store: the two pages' state shapes only share "selectedPsalm" and
//: "referenceColorMode," and forcing a shared generic abstraction over
//: that overlap would be more machinery than the actual duplication (a
//: few lines) justifies.

import type { ReferenceColorMode } from "../lib/referenceColor";

export type ClusterViewMode = "alignment" | "scatter";

export interface ClusterState {
  selectedPsalm: number | null;
  selectedClusterMethodId: string;
  referenceColorMode: ReferenceColorMode;
  clusterView: ClusterViewMode;
}

export const initialClusterState: ClusterState = {
  selectedPsalm: null,
  // Set for real once data loads (see cluster.ts) - the true default comes
  // from the fetched payload's `defaultClusterMethod`, not a hardcoded guess.
  selectedClusterMethodId: "",
  // Unlike Compare, this page's whole point is genre recovery - opening
  // colored by Gunkel's 6 families (rather than Books) makes the picker
  // itself already show the ground truth the clustering is being checked
  // against.
  referenceColorMode: "family",
  clusterView: "alignment",
};

export type ClusterAction =
  | { type: "SELECT_PSALM"; psalm: number | null }
  | { type: "SET_CLUSTER_METHOD"; methodId: string }
  | { type: "SET_REFERENCE_COLOR_MODE"; mode: ReferenceColorMode }
  | { type: "SET_CLUSTER_VIEW"; view: ClusterViewMode };

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

type Listener = (state: ClusterState) => void;

/** Minimal observable store: single source of truth for the Cluster page's UI state. */
export class ClusterStore {
  private state: ClusterState;
  private readonly listeners = new Set<Listener>();

  constructor(initial: ClusterState = initialClusterState) {
    this.state = initial;
  }

  getState(): ClusterState {
    return this.state;
  }

  dispatch(action: ClusterAction): void {
    this.state = reduceCluster(this.state, action);
    for (const listener of this.listeners) listener(this.state);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
