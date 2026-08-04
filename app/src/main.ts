import "./style.css";
import { renderDetailPanel, renderEmptyDetail } from "./components/detailPanel";
import { createPsalmPicker } from "./components/psalmPicker";
import { loadSimilarityData } from "./data/loadSimilarityData";
import { initialState, Store, type ViewMode } from "./state/store";
import type { SimilarityPayload } from "./types";
import { Heatmap } from "./viz/heatmap";
import { NetworkGraph } from "./viz/network";

const DATA_URL = `${import.meta.env.BASE_URL}data/similarity.json`;

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

  const store = new Store(initialState);

  const methodBadge = requireEl("#method-badge");
  methodBadge.textContent = "Lexical similarity · TF-IDF cosine";
  methodBadge.title = data.meta.description;

  const corpusCredit = requireEl("#corpus-credit");
  corpusCredit.textContent = `${data.meta.corpus.name} ${data.meta.corpus.version} · ${data.meta.psalmCount} psalms · via Text-Fabric`;

  const detailPanel = requireEl("#detail-panel");
  const psalmSearch = requireEl<HTMLInputElement>("#psalm-search");

  const selectPsalm = (psalm: number): void => {
    store.dispatch({ type: "SELECT_PSALM", psalm });
  };

  const picker = createPsalmPicker(
    requireEl("#psalm-grid"),
    requireEl("#book-legend"),
    data,
    selectPsalm,
  );

  const heatmap = new Heatmap({
    container: requireEl("#heatmap-container"),
    data,
    onSelect: selectPsalm,
  });

  const edgeCountEl = requireEl("#edge-count");
  const network = new NetworkGraph({
    container: requireEl("#network-container"),
    data,
    onSelect: selectPsalm,
    onEdgeCountChange: (count) => {
      edgeCountEl.textContent = `${count.toLocaleString()} connections shown`;
    },
  });

  setupViewTabs(store);
  setupThresholdSlider(network);

  psalmSearch.addEventListener("change", () => {
    const value = Number(psalmSearch.value);
    if (Number.isInteger(value) && value >= 1 && value <= data.psalmNumbers.length) {
      selectPsalm(value);
    }
  });

  store.subscribe((state) => {
    picker.setSelected(state.selectedPsalm);
    heatmap.setSelected(state.selectedPsalm);
    network.setSelected(state.selectedPsalm);

    if (state.selectedPsalm === null) {
      renderEmptyDetail(detailPanel);
    } else {
      renderDetailPanel(detailPanel, data, state.selectedPsalm, selectPsalm);
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

function setupThresholdSlider(network: NetworkGraph): void {
  const slider = requireEl<HTMLInputElement>("#threshold-slider");
  const valueOutput = requireEl("#threshold-value");

  const defaultThreshold = 0.3;
  slider.value = String(defaultThreshold);
  valueOutput.textContent = defaultThreshold.toFixed(2);
  network.setThreshold(defaultThreshold);

  slider.addEventListener("input", () => {
    const threshold = Number(slider.value);
    valueOutput.textContent = threshold.toFixed(2);
    network.setThreshold(threshold);
  });
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
