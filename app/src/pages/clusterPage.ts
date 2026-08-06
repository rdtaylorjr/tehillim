import { renderClusterDetailPanel, renderEmptyDetail } from "../components/clusterDetailPanel";
import { renderGenreAlignmentView, type GenreAlignmentView } from "../components/genreAlignmentView";
import { renderLoadError } from "../components/loadError";
import { createPsalmPicker, type PsalmPicker } from "../components/psalmPicker";
import { setupReferenceColorSelect } from "../components/referenceColorSelect";
import { loadClusteringData } from "../data/loadClusteringData";
import { loadGunkelData } from "../data/loadGunkelData";
import { alignmentFor, selectedAlignmentCell } from "../lib/alignmentCell";
import { formatAppVersion } from "../lib/appVersion";
import { formatCorpusCredit } from "../lib/corpusCredit";
import { requireEl } from "../lib/dom";
import { featureNameFromMethodId } from "../lib/featureNames";
import type { PageController } from "../lib/pageController";
import { createReferenceColoring, type ReferenceColorMode } from "../lib/referenceColor";
import { describeKStability } from "../lib/kStabilityConfidence";
import { describeScatterConfidence } from "../lib/scatterConfidence";
import { ClusterStore, initialClusterState, type ClusterViewMode } from "../state/clusterStore";
import type { ClusterMethodPayload, ClusteringPayload, GunkelPayload } from "../types";
import { renderScatterPlot, type ScatterPlot } from "../viz/scatterPlot";

const CLUSTERING_URL = `${import.meta.env.BASE_URL}data/clustering.json`;
const GUNKEL_URL = `${import.meta.env.BASE_URL}data/gunkel.json`;

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
      <p class="subtitle">Unsupervised clustering across the Hebrew Psalter</p>
    </div>
    <nav class="page-nav" aria-label="Pages">
      <a href="/compare/" data-route="compare">Compare</a>
      <a href="/cluster/" data-route="cluster" aria-current="page">Cluster</a>
    </nav>
    <div class="method-picker">
      <label class="visually-hidden" for="cluster-method-select">Clustering signal</label>
      <select id="cluster-method-select"></select>
    </div>
  </header>

  <main class="layout layout-cluster">
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

    <section class="viz-panel" aria-label="Clustering results">
      <p class="view-hint" id="cluster-method-description"></p>
      <p class="caveat-badge is-hidden" id="no-structure-badge"></p>
      <p class="view-caption" id="k-stability-note"></p>

      <div class="view-tabs" role="tablist">
        <button class="view-tab is-active" type="button" data-view="alignment" role="tab" aria-selected="true">
          Genre Alignment
        </button>
        <button class="view-tab" type="button" data-view="scatter" role="tab" aria-selected="false">
          Scatter Plot
        </button>
      </div>

      <div class="view" id="alignment-view" role="tabpanel">
        <div class="alignment-matrix" id="alignment-matrix"></div>
      </div>

      <div class="view" id="scatter-view" role="tabpanel" hidden>
        <div class="scatter-container" id="scatter-container"></div>
        <p class="view-caption" id="scatter-structure-note"></p>
      </div>
    </section>

    <aside class="detail-panel" id="detail-panel" aria-label="Psalm detail">
      <div class="detail-empty">
        <p>Select a psalm from the grid to see its cluster and fellow members.</p>
      </div>
    </aside>
  </main>

  <footer class="app-footer">
    <span id="app-version"></span>
    <span class="footer-sep">&middot;</span>
    <span id="corpus-credit"></span>
  </footer>
`;

/** Mounts the Cluster page (unsupervised partitioning: scatter plot +
 * genre-alignment table) into `root`. Renders its HTML skeleton
 * synchronously before fetching data, so navigating here never shows a
 * blank root while the fetch is in flight. `isStale` is checked right
 * after every await, so a mount that's superseded by a later navigation
 * (see lib/mountGuard.ts) bails out before touching a DOM that now
 * belongs to a different page. */
export async function mountClusterPage(
  root: HTMLElement,
  isStale: () => boolean,
): Promise<PageController> {
  root.innerHTML = TEMPLATE;
  document.title = "Cluster the Psalms";

  let data: ClusteringPayload;
  let gunkel: GunkelPayload;
  try {
    [data, gunkel] = await Promise.all([
      loadClusteringData(CLUSTERING_URL),
      loadGunkelData(GUNKEL_URL),
    ]);
  } catch (error) {
    if (!isStale()) {
      renderLoadError(root, error, {
        heading: "Could not load clustering data",
        missingDataFiles: "app/public/data/clustering.json and app/public/data/gunkel.json",
      });
    }
    return { unmount(): void {} };
  }
  if (isStale()) return { unmount(): void {} };

  const store = new ClusterStore({
    ...initialClusterState,
    selectedClusterMethodId: data.defaultClusterMethod,
  });

  const methodOf = (methodId: string): ClusterMethodPayload =>
    data.clusterMethods.find((m) => m.id === methodId) ?? data.clusterMethods[0];

  const methodDescription = requireEl("#cluster-method-description");
  const corpusCredit = requireEl("#corpus-credit");
  corpusCredit.textContent = formatCorpusCredit(data.corpus.name, data.corpus.version);
  requireEl("#app-version").textContent = formatAppVersion(__APP_VERSION__);

  const detailPanel = requireEl("#detail-panel");
  const psalmSearch = requireEl<HTMLInputElement>("#psalm-search");
  const pickerGridEl = requireEl("#psalm-grid");
  const pickerLegendEl = requireEl("#picker-legend");
  const scatterEl = requireEl("#scatter-container");
  const scatterStructureNote = requireEl("#scatter-structure-note");
  const noStructureBadge = requireEl("#no-structure-badge");
  const kStabilityNote = requireEl("#k-stability-note");
  const alignmentEl = requireEl("#alignment-matrix");

  const selectPsalm = (psalm: number): void => {
    store.dispatch({ type: "SELECT_PSALM", psalm });
  };
  const deselectPsalm = (): void => {
    store.dispatch({ type: "SELECT_PSALM", psalm: null });
  };

  let picker: PsalmPicker;
  let scatterPlot: ScatterPlot;
  let genreAlignmentView: GenreAlignmentView | undefined;

  // The alluvial diagram's genre axis needs a name -> color lookup, always
  // at Gunkel granularity (never "book" - the same fallback alignmentFor
  // already uses, since a genre-alignment view has no book axis to color
  // by). Reusing createReferenceColoring's own scale means these colors
  // are always identical to whatever the picker shows whenever the picker
  // itself is in a Gunkel mode - the alluvial never introduces a second,
  // competing color meaning.
  const genreColorLookup = (mode: ReferenceColorMode): ((genre: string) => string) => {
    const granularity = mode === "family" ? "family" : "genre";
    const colorByLabel = new Map(
      createReferenceColoring(granularity, gunkel).legend.map((entry) => [entry.label, entry.color]),
    );
    return (genre: string) => colorByLabel.get(genre) ?? "#898781";
  };

  const mountGenreAlignment = (method: ClusterMethodPayload): void => {
    const state = store.getState();
    genreAlignmentView?.destroy();
    genreAlignmentView = renderGenreAlignmentView(
      alignmentEl,
      alignmentFor(method, state.referenceColorMode),
      genreColorLookup(state.referenceColorMode),
      selectedAlignmentCell(gunkel, method, state.referenceColorMode, state.selectedPsalm),
      method.id,
    );
  };

  // The picker (nav, canonical psalm order) and the scatter plot (this
  // signal's own 2D similarity layout) always share one reference coloring
  // - see lib/referenceColor.ts. Cluster identity is never a color: it's
  // the hull outlines traced around each cluster's points in the scatter
  // plot.
  const mountVisualizations = (method: ClusterMethodPayload): void => {
    const coloring = createReferenceColoring(store.getState().referenceColorMode, gunkel);

    // The gap statistic (see README's "Statistical validation
    // methodology") can legitimately choose k=1 - "no cluster structure
    // beyond what a same-value-distribution structureless reference would
    // show" - unlike silhouette, which is undefined at k=1 and so could
    // never say that on its own. The scatter plot and genre alignment
    // below still render for k=1 (a single trivial cluster is well-
    // defined), but they have nothing real to show, so this says so
    // plainly rather than letting a technically-valid, meaningless chart
    // stand in for a real result.
    noStructureBadge.classList.toggle("is-hidden", method.nClusters > 1);
    if (method.nClusters <= 1) {
      noStructureBadge.textContent =
        "This signal's cluster count is 1 - the gap statistic found no cluster structure beyond what a structureless reference with the same similarity values would show. The scatter plot and genre alignment below are technically well-defined but trivial for a single cluster, not evidence of real structure.";
    }

    picker?.destroy();
    picker = createPsalmPicker(pickerGridEl, pickerLegendEl, data.psalms, coloring, selectPsalm);

    scatterPlot?.destroy();
    scatterPlot = renderScatterPlot(scatterEl, data.psalms, method, coloring, selectPsalm, deselectPsalm);

    // How settled this signal's data-chosen cluster count actually is -
    // silhouette score alone reports one winning k with no sense of
    // whether a different corpus resample would have picked another (see
    // README's "Statistical validation methodology"). Hidden entirely for
    // a fixed_k method (kStability null), since there's nothing to report.
    const kStability = describeKStability(method.nClusters, method.kStability);
    kStabilityNote.textContent = kStability?.message ?? "";
    kStabilityNote.className = kStability
      ? `view-caption k-stability-note is-${kStability.level}`
      : "view-caption is-hidden";

    // A clean-looking scatter plot can still carry almost no real signal
    // (a partition statistically indistinguishable from a random one) -
    // checked directly against real data this project has shipped. This
    // ties the chart's visual confidence to the same numbers the Genre
    // Alignment tab already reports, rather than leaving "looks clean" and
    // "is real" decoupled across two tabs a viewer might not both open.
    const alignment = alignmentFor(method, store.getState().referenceColorMode);
    const confidence = describeScatterConfidence(
      method.embedding.structureCaptured,
      alignment.ami,
      alignment.ari,
    );
    scatterStructureNote.textContent = confidence.message;
    scatterStructureNote.className = `view-caption scatter-confidence is-${confidence.level}`;
    scatterEl.classList.toggle("is-low-confidence", confidence.level === "low");
  };

  setupClusterMethodSelect(store, data, methodDescription);
  setupReferenceColorSelect(store.getState().referenceColorMode, (mode) => {
    store.dispatch({ type: "SET_REFERENCE_COLOR_MODE", mode });
  });
  setupClusterViewTabs(store);
  mountVisualizations(methodOf(store.getState().selectedClusterMethodId));
  mountGenreAlignment(methodOf(store.getState().selectedClusterMethodId));

  psalmSearch.addEventListener("change", () => {
    const value = Number(psalmSearch.value);
    if (Number.isInteger(value) && value >= 1 && value <= data.psalms.length) {
      selectPsalm(value);
    }
  });

  let mountedMethodId = store.getState().selectedClusterMethodId;
  let mountedColorMode = store.getState().referenceColorMode;

  const unsubscribe = store.subscribe((state) => {
    const methodChanged = state.selectedClusterMethodId !== mountedMethodId;
    const colorModeChanged = state.referenceColorMode !== mountedColorMode;

    if (methodChanged || colorModeChanged) {
      mountedMethodId = state.selectedClusterMethodId;
      mountedColorMode = state.referenceColorMode;
      mountVisualizations(methodOf(state.selectedClusterMethodId));
    }

    // Re-rendered on every state change, not just method/color-mode
    // changes, so the selected-psalm ribbon/cell highlight (see
    // selectedAlignmentCell) stays in sync with picker/scatter selection.
    mountGenreAlignment(methodOf(state.selectedClusterMethodId));

    picker.setSelected(state.selectedPsalm);
    scatterPlot.setSelected(state.selectedPsalm);

    if (state.selectedPsalm === null) {
      renderEmptyDetail(detailPanel);
    } else {
      renderClusterDetailPanel(
        detailPanel,
        data.psalms,
        methodOf(state.selectedClusterMethodId),
        state.selectedPsalm,
        selectPsalm,
      );
      if (psalmSearch !== document.activeElement) {
        psalmSearch.value = String(state.selectedPsalm);
      }
    }
  });

  // Open on a psalm with rich, legible similarity structure - same choice
  // comparePage.ts makes, for a consistent first impression.
  selectPsalm(23);

  return {
    unmount(): void {
      unsubscribe();
      picker?.destroy();
      scatterPlot?.destroy();
      genreAlignmentView?.destroy();
    },
  };
}

function setupClusterViewTabs(store: ClusterStore): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>(".view-tab");
  const views: Record<ClusterViewMode, HTMLElement> = {
    scatter: requireEl("#scatter-view"),
    alignment: requireEl("#alignment-view"),
  };

  const applyView = (view: ClusterViewMode): void => {
    for (const [name, el] of Object.entries(views)) {
      el.hidden = name !== view;
    }
    for (const tab of tabs) {
      const isActive = tab.dataset.view === view;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    }
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const view = tab.dataset.view as ClusterViewMode;
      store.dispatch({ type: "SET_CLUSTER_VIEW", view });
      applyView(view);
    });
  }

  applyView(store.getState().clusterView);
}

function setupClusterMethodSelect(
  store: ClusterStore,
  data: ClusteringPayload,
  description: HTMLElement,
): void {
  const select = requireEl<HTMLSelectElement>("#cluster-method-select");
  select.innerHTML = "";
  for (const method of data.clusterMethods) {
    const option = document.createElement("option");
    option.value = method.id;
    option.textContent = featureNameFromMethodId(method.id);
    option.title = method.description;
    select.append(option);
  }

  const applyMethod = (methodId: string): void => {
    const method = data.clusterMethods.find((m) => m.id === methodId) ?? data.clusterMethods[0];
    select.value = method.id;
    select.title = method.description;
    description.textContent = method.description;
  };

  select.addEventListener("change", () => {
    store.dispatch({ type: "SET_CLUSTER_METHOD", methodId: select.value });
  });

  store.subscribe((state) => applyMethod(state.selectedClusterMethodId));
  applyMethod(store.getState().selectedClusterMethodId);
}
