import { renderGradientLegend } from "../components/colorLegend";
import { renderDetailPanel, renderEmptyDetail } from "../components/detailPanel";
import { renderLoadError } from "../components/loadError";
import { createPsalmPicker } from "../components/psalmPicker";
import { setupReferenceColorSelect } from "../components/referenceColorSelect";
import { loadGunkelData } from "../data/loadGunkelData";
import { loadSimilarityData } from "../data/loadSimilarityData";
import { formatAppVersion } from "../lib/appVersion";
import { formatCorpusCredit } from "../lib/corpusCredit";
import { requireEl } from "../lib/dom";
import { featureNameFromMethodId } from "../lib/featureNames";
import { percentileOffDiagonal } from "../lib/matrix";
import type { PageController } from "../lib/pageController";
import { createReferenceColoring, type ReferenceColoring } from "../lib/referenceColor";
import { initialState, Store, type ViewMode } from "../state/store";
import type { GunkelPayload, MethodPayload, SimilarityPayload } from "../types";
import { Heatmap } from "../viz/heatmap";
import { NetworkGraph } from "../viz/network";

const DATA_URL = `${import.meta.env.BASE_URL}data/similarity.json`;
const GUNKEL_URL = `${import.meta.env.BASE_URL}data/gunkel.json`;

//: Default network threshold picked per-method as this percentile of that
//: method's own off-diagonal score distribution, rather than a fixed
//: absolute value - methods can have very different baseline similarity
//: (verb-morphology's is far higher than lexical's), so a fixed threshold
//: gives a readable graph for one and an unreadable hairball for another.
const DEFAULT_THRESHOLD_PERCENTILE = 98;

const TEMPLATE = `
  <header class="app-header">
    <a
      class="brand"
      href="https://github.com/rdtaylorjr/tehillim"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View source on GitHub"
    >
      <span class="brand-mark">ת</span>
    </a>
    <div class="title-block">
      <h1>Computational Analysis of Psalms</h1>
      <p class="subtitle">Psalm-to-psalm similarity across the Hebrew Psalter</p>
    </div>
    <nav class="page-nav" aria-label="Pages">
      <a href="/compare/" data-route="compare" aria-current="page">Compare</a>
      <a href="/cluster/" data-route="cluster">Cluster</a>
    </nav>
    <div class="method-picker">
      <label class="visually-hidden" for="method-select">Comparison method</label>
      <select id="method-select"></select>
    </div>
  </header>

  <main class="layout">
    <section class="picker-panel" aria-label="Psalm picker">
      <div class="picker-header">
        <label for="psalm-search">Jump to Psalm</label>
        <input id="psalm-search" type="number" min="1" max="150" placeholder="1&ndash;150" autocomplete="off" />
      </div>
      <div class="picker-header">
        <label for="reference-color-select">Color by</label>
        <select id="reference-color-select"></select>
      </div>
      <div class="psalm-grid" id="psalm-grid" role="listbox" aria-label="Select a psalm"></div>
      <ul class="book-legend" id="picker-legend" aria-label="Color legend"></ul>
    </section>

    <section class="viz-panel" aria-label="Visualization">
      <p class="view-hint" id="method-description"></p>
      <div class="view-tabs" role="tablist">
        <button class="view-tab is-active" type="button" data-view="matrix" role="tab" aria-selected="true">
          Similarity Matrix
        </button>
        <button class="view-tab" type="button" data-view="network" role="tab" aria-selected="false">
          Network Graph
        </button>
      </div>

      <div class="view" id="matrix-view" role="tabpanel">
        <div class="heatmap-container" id="heatmap-container"></div>
        <div class="heatmap-legend" id="heatmap-legend"></div>
      </div>

      <div class="view" id="network-view" role="tabpanel" hidden>
        <div class="network-controls">
          <label for="threshold-slider">Similarity threshold</label>
          <input id="threshold-slider" type="range" min="0" max="1" step="0.01" />
          <output id="threshold-value" for="threshold-slider"></output>
          <span class="edge-count" id="edge-count"></span>
        </div>
        <div class="network-container" id="network-container"></div>
      </div>
    </section>

    <aside class="detail-panel" id="detail-panel" aria-label="Psalm detail">
      <div class="detail-empty">
        <p>Select a psalm from the grid or the visualization to see its closest matches.</p>
      </div>
    </aside>
  </main>

  <footer class="app-footer">
    <span id="app-version"></span>
    <span class="footer-sep">&middot;</span>
    <span id="corpus-credit"></span>
  </footer>
`;

/** Mounts the Compare page (pairwise similarity: heatmap + network graph)
 * into `root`. Renders its HTML skeleton synchronously before fetching
 * data, so navigating here never shows a blank root while the fetch is in
 * flight. `isStale` is checked right after every await, so a mount that's
 * superseded by a later navigation (see lib/mountGuard.ts) bails out
 * before touching a DOM that now belongs to a different page. */
export async function mountComparePage(
  root: HTMLElement,
  isStale: () => boolean,
): Promise<PageController> {
  root.innerHTML = TEMPLATE;
  document.title = "Compare the Psalms";

  let data: SimilarityPayload;
  let gunkel: GunkelPayload;
  try {
    [data, gunkel] = await Promise.all([loadSimilarityData(DATA_URL), loadGunkelData(GUNKEL_URL)]);
  } catch (error) {
    if (!isStale()) {
      renderLoadError(root, error, {
        heading: "Could not load similarity data",
        missingDataFiles: "app/public/data/similarity.json and app/public/data/gunkel.json",
      });
    }
    return { unmount(): void {} };
  }
  if (isStale()) return { unmount(): void {} };

  const store = new Store({ ...initialState, selectedMethodId: data.defaultMethod });

  const methodOf = (methodId: string): MethodPayload =>
    data.methods.find((m) => m.id === methodId) ?? data.methods[0];

  const methodDescription = requireEl("#method-description");
  const corpusCredit = requireEl("#corpus-credit");
  corpusCredit.textContent = formatCorpusCredit(data.corpus.name, data.corpus.version);
  requireEl("#app-version").textContent = formatAppVersion(__APP_VERSION__);

  const detailPanel = requireEl("#detail-panel");
  const psalmSearch = requireEl<HTMLInputElement>("#psalm-search");
  const pickerGridEl = requireEl("#psalm-grid");
  const pickerLegendEl = requireEl("#picker-legend");

  const selectPsalm = (psalm: number): void => {
    store.dispatch({ type: "SELECT_PSALM", psalm });
  };

  let currentColoring: ReferenceColoring = createReferenceColoring(
    store.getState().referenceColorMode,
    gunkel,
  );

  let picker = createPsalmPicker(pickerGridEl, pickerLegendEl, data.psalms, currentColoring, selectPsalm);

  setupReferenceColorSelect(store.getState().referenceColorMode, (mode) => {
    store.dispatch({ type: "SET_REFERENCE_COLOR_MODE", mode });
  });

  const heatmapContainer = requireEl("#heatmap-container");
  const heatmapLegend = requireEl("#heatmap-legend");
  const networkContainer = requireEl("#network-container");
  const edgeCountEl = requireEl("#edge-count");

  let heatmap: Heatmap;
  let network: NetworkGraph;

  const mountVisualizations = (method: MethodPayload): void => {
    heatmap?.destroy();
    network?.destroy();

    heatmap = new Heatmap({ container: heatmapContainer, data: method, onSelect: selectPsalm });
    renderGradientLegend(heatmapLegend, heatmap.colorScale, heatmap.colorDomainMax);
    network = new NetworkGraph({
      container: networkContainer,
      data: method,
      coloring: currentColoring,
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
  let mountedColorMode = store.getState().referenceColorMode;

  const unsubscribe = store.subscribe((state) => {
    // The similarity matrix is entirely different per method, so a method
    // change remounts the heatmap/network rather than trying to patch them
    // in place - simpler and less error-prone than tracking every piece of
    // per-method internal state (color scale domain, force layout, ...).
    if (state.selectedMethodId !== mountedMethodId) {
      mountedMethodId = state.selectedMethodId;
      mountVisualizations(methodOf(state.selectedMethodId));
    }

    if (state.referenceColorMode !== mountedColorMode) {
      mountedColorMode = state.referenceColorMode;
      currentColoring = createReferenceColoring(state.referenceColorMode, gunkel);
      picker.destroy();
      picker = createPsalmPicker(pickerGridEl, pickerLegendEl, data.psalms, currentColoring, selectPsalm);
      network.setColoring(currentColoring);
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

  return {
    unmount(): void {
      unsubscribe();
      heatmap?.destroy();
      network?.destroy();
      picker.destroy();
    },
  };
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
    option.textContent = featureNameFromMethodId(method.id);
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
