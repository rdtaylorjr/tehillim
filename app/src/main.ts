import "./style.css";
import { renderDetailPanel, renderEmptyDetail } from "./components/detailPanel";
import { createPsalmPicker } from "./components/psalmPicker";
import { loadSimilarityData } from "./data/loadSimilarityData";
import { percentileOffDiagonal } from "./lib/matrix";
import { initialState, Store, type ViewMode } from "./state/store";
import type { MethodPayload, SimilarityPayload } from "./types";
import { Heatmap } from "./viz/heatmap";
import { NetworkGraph } from "./viz/network";

const DATA_URL = `${import.meta.env.BASE_URL}data/similarity.json`;

//: Default network threshold picked per-method as this percentile of that
//: method's own off-diagonal score distribution, rather than a fixed
//: absolute value - methods can have very different baseline similarity
//: (verb-morphology's is far higher than lexical's), so a fixed threshold
//: gives a readable graph for one and an unreadable hairball for another.
const DEFAULT_THRESHOLD_PERCENTILE = 98;

//: Human-readable display names for known method ids. Falls back to the
//: raw id for any method added to the pipeline before this map is updated,
//: so a new method still shows up (just less prettily) rather than breaking.
const METHOD_LABELS: Record<string, string> = {
  "lexical-tfidf-cosine": "Lexical Similarity",
  "root-tfidf-cosine": "Lexical Similarity (Root)",
  "named-entity-identity-tfidf-cosine": "Lexical Similarity (Named Entities)",
  "verb-morphology-tfidf-cosine": "Syntactic Similarity (Verb Morphology)",
  "person-profile-tfidf-cosine": "Syntactic Similarity (Person)",
  "lexical-set-tfidf-cosine": "Syntactic Similarity (Lexical Set)",
  "named-entity-tfidf-cosine": "Syntactic Similarity (Named Entity Type)",
  "clause-type-tfidf-cosine": "Clause Structure (Clause Type)",
  "text-type-tfidf-cosine": "Clause Structure (Text Type)",
  "clause-relation-tfidf-cosine": "Clause Structure (Clause Relation)",
  "verb-sense-tfidf-cosine": "Clause Structure (Verb Sense)",
};

function methodLabel(id: string): string {
  return METHOD_LABELS[id] ?? id;
}

async function main(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app root element");

  let data: SimilarityPayload;
  try {
    data = await loadSimilarityData(DATA_URL);
  } catch (error) {
    renderLoadError(app, error);
    return;
  }

  const store = new Store({ ...initialState, selectedMethodId: data.defaultMethod });

  const methodOf = (methodId: string): MethodPayload =>
    data.methods.find((m) => m.id === methodId) ?? data.methods[0];

  const methodDescription = requireEl("#method-description");
  const corpusCredit = requireEl("#corpus-credit");
  corpusCredit.textContent = `${data.corpus.name} ${data.corpus.version} · via Text-Fabric`;

  const detailPanel = requireEl("#detail-panel");
  const psalmSearch = requireEl<HTMLInputElement>("#psalm-search");

  const selectPsalm = (psalm: number): void => {
    store.dispatch({ type: "SELECT_PSALM", psalm });
  };

  const picker = createPsalmPicker(
    requireEl("#psalm-grid"),
    requireEl("#book-legend"),
    data.psalms,
    selectPsalm,
  );

  const heatmapContainer = requireEl("#heatmap-container");
  const networkContainer = requireEl("#network-container");
  const edgeCountEl = requireEl("#edge-count");

  let heatmap: Heatmap;
  let network: NetworkGraph;

  const mountVisualizations = (method: MethodPayload): void => {
    heatmap?.destroy();
    network?.destroy();

    heatmap = new Heatmap({ container: heatmapContainer, data: method, onSelect: selectPsalm });
    network = new NetworkGraph({
      container: networkContainer,
      data: method,
      onSelect: selectPsalm,
      onEdgeCountChange: (count) => {
        edgeCountEl.textContent = `${count.toLocaleString()} connections shown`;
      },
    });
    const defaultThreshold = percentileOffDiagonal(method.matrix, DEFAULT_THRESHOLD_PERCENTILE);
    setupThresholdSlider(network, defaultThreshold);
  };

  setupViewTabs(store);
  setupMethodSelect(store, data, methodDescription);
  mountVisualizations(methodOf(store.getState().selectedMethodId));

  psalmSearch.addEventListener("change", () => {
    const value = Number(psalmSearch.value);
    if (Number.isInteger(value) && value >= 1 && value <= data.psalms.length) {
      selectPsalm(value);
    }
  });

  let mountedMethodId = store.getState().selectedMethodId;

  store.subscribe((state) => {
    // The similarity matrix is entirely different per method, so a method
    // change remounts the heatmap/network rather than trying to patch them
    // in place - simpler and less error-prone than tracking every piece of
    // per-method internal state (color scale domain, force layout, ...).
    if (state.selectedMethodId !== mountedMethodId) {
      mountedMethodId = state.selectedMethodId;
      mountVisualizations(methodOf(state.selectedMethodId));
    }

    picker.setSelected(state.selectedPsalm);
    heatmap.setSelected(state.selectedPsalm);
    network.setSelected(state.selectedPsalm);

    if (state.selectedPsalm === null) {
      renderEmptyDetail(detailPanel);
    } else {
      renderDetailPanel(
        detailPanel,
        data.psalms,
        methodOf(state.selectedMethodId),
        state.selectedPsalm,
        selectPsalm,
      );
      if (psalmSearch !== document.activeElement) {
        psalmSearch.value = String(state.selectedPsalm);
      }
    }
  });

  // Open on a psalm with rich, legible similarity structure.
  selectPsalm(23);
}

function setupViewTabs(store: Store): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>(".view-tab");
  const matrixView = requireEl("#matrix-view");
  const networkView = requireEl("#network-view");

  const applyView = (view: ViewMode): void => {
    matrixView.hidden = view !== "matrix";
    networkView.hidden = view !== "network";
    for (const tab of tabs) {
      const isActive = tab.dataset.view === view;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    }
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const view = tab.dataset.view as ViewMode;
      store.dispatch({ type: "SET_VIEW", view });
      applyView(view);
    });
  }

  applyView(store.getState().view);
}

function setupMethodSelect(store: Store, data: SimilarityPayload, description: HTMLElement): void {
  const select = requireEl<HTMLSelectElement>("#method-select");
  select.innerHTML = "";
  for (const method of data.methods) {
    const option = document.createElement("option");
    option.value = method.id;
    option.textContent = methodLabel(method.id);
    option.title = method.description;
    select.append(option);
  }

  const applyMethod = (methodId: string): void => {
    const method = data.methods.find((m) => m.id === methodId) ?? data.methods[0];
    select.value = method.id;
    select.title = method.description;
    description.textContent = method.description;
  };

  select.addEventListener("change", () => {
    store.dispatch({ type: "SET_METHOD", methodId: select.value });
  });

  store.subscribe((state) => applyMethod(state.selectedMethodId));
  applyMethod(store.getState().selectedMethodId);
}

function setupThresholdSlider(network: NetworkGraph, defaultThreshold: number): void {
  const slider = requireEl<HTMLInputElement>("#threshold-slider");
  const valueOutput = requireEl("#threshold-value");

  slider.value = String(defaultThreshold);
  valueOutput.textContent = defaultThreshold.toFixed(2);
  network.setThreshold(defaultThreshold);

  slider.oninput = () => {
    const threshold = Number(slider.value);
    valueOutput.textContent = threshold.toFixed(2);
    network.setThreshold(threshold);
  };
}

function renderLoadError(app: HTMLElement, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  app.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.style.padding = "60px 24px";
  wrapper.style.textAlign = "center";
  wrapper.style.fontFamily = "Inter, sans-serif";

  const heading = document.createElement("h1");
  heading.textContent = "Could not load similarity data";

  const detail = document.createElement("p");
  detail.textContent = message;
  detail.style.color = "#5f6c72";

  const hint = document.createElement("p");
  hint.textContent =
    "Run the pipeline (see pipeline/README.md) to generate app/public/data/similarity.json.";
  hint.style.color = "#5f6c72";

  wrapper.append(heading, detail, hint);
  app.append(wrapper);
}

function requireEl<T extends HTMLElement = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing required element: ${selector}`);
  return el;
}

main().catch((error: unknown) => {
  console.error(error);
});
