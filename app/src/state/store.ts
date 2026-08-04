export type ViewMode = "matrix" | "network";

export interface AppState {
  selectedPsalm: number | null;
  selectedMethodId: string;
  view: ViewMode;
  networkThreshold: number;
}

export const initialState: AppState = {
  selectedPsalm: null,
  // Set for real once data loads (see main.ts) - the true default comes
  // from the fetched payload's `defaultMethod`, not a hardcoded guess.
  selectedMethodId: "",
  view: "matrix",
  networkThreshold: 0.35,
};

export type Action =
  | { type: "SELECT_PSALM"; psalm: number | null }
  | { type: "SET_METHOD"; methodId: string }
  | { type: "SET_VIEW"; view: ViewMode }
  | { type: "SET_THRESHOLD"; threshold: number };

export function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SELECT_PSALM":
      return { ...state, selectedPsalm: action.psalm };
    case "SET_METHOD":
      return { ...state, selectedMethodId: action.methodId };
    case "SET_VIEW":
      return { ...state, view: action.view };
    case "SET_THRESHOLD":
      return {
        ...state,
        networkThreshold: Math.min(1, Math.max(0, action.threshold)),
      };
  }
}

type Listener = (state: AppState) => void;

/** Minimal observable store: single source of truth for UI state. */
export class Store {
  private state: AppState;
  private readonly listeners = new Set<Listener>();

  constructor(initial: AppState = initialState) {
    this.state = initial;
  }

  getState(): AppState {
    return this.state;
  }

  dispatch(action: Action): void {
    this.state = reduce(this.state, action);
    for (const listener of this.listeners) listener(this.state);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
