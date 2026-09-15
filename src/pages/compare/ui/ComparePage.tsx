import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import layout from "../../../shared/ui/panel.module.css";
import viz from "../../../shared/ui/vizPanel.module.css";
import band from "../../../shared/ui/controlBand.module.css";
import { PageFooter, PageHeader } from "../../../widgets/layout";
import { PsalmPicker } from "../../../widgets/psalm-picker";
import { MethodAxisRows, ModelDropdown } from "../../../widgets/toolbar";
import {
  axisLabels,
  choiceOfMethod,
  headCrumbs,
  methodChoiceReducer,
  methodFamilies,
  resolveMethod,
} from "../../../shared/lib/navigation";
import { VizHead } from "../../../shared/ui/VizHead";
import { LoadError, ViewTabs } from "../../../widgets/viz-panel";
import { DetailPanel, DetailShell, EmptyDetail } from "../../../widgets/detail-panel";
import { Heatmap } from "../charts/Heatmap";
import { NetworkGraph } from "../charts/NetworkGraph";
import {
  createCompareMethodLoader,
  loadCompareIndex,
  loadGunkelData,
} from "../../../shared/api";
import type { CompareMethodLoad, CompareMethodLoader } from "../../../shared/api";
import { createReferenceColoring } from "../../../shared/lib/color";
import { INITIAL_COMPARE_STATE, reduceCompare } from "../../../shared/model";
import type { ViewMode } from "../../../shared/model";
import type {
  CompareIndex,
  CompareMethodMeta,
  GunkelPayload,
  MethodPayload,
} from "../../../shared/model";
import type { PlotApi } from "../../../shared/charts";
import type { NavigateHandler } from "../../../../shell/Root";

const TABS: readonly { id: ViewMode; label: string }[] = [
  { id: "matrix", label: "Similarity Matrix" },
  { id: "network", label: "Network Graph" },
];

interface Loaded {
  readonly index: CompareIndex;
  readonly gunkel: GunkelPayload;
}

export interface ComparePageProps {
  readonly navigate: NavigateHandler;
  /** Injected in tests so the page can be driven without a server. */
  readonly load?: () => Promise<Loaded>;
  /** Injected in tests so a method's matrix can be served without a server. */
  readonly loadMethod?: CompareMethodLoader;
  /** Injected in tests so the views render without a real Plotly canvas. */
  readonly api?: PlotApi;
}

export function ComparePage({
  navigate,
  load,
  loadMethod,
  api,
}: ComparePageProps): React.ReactElement {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<unknown>(null);
  //: One loader for the page's life, so a method's matrix is fetched once however often it is chosen.
  const [methodLoader] = useState<CompareMethodLoader>(
    () => loadMethod ?? createCompareMethodLoader(),
  );

  useEffect(() => {
    let current = true;
    const fetchAll =
      load ??
      (async (): Promise<Loaded> => {
        const [index, gunkel] = await Promise.all([loadCompareIndex(), loadGunkelData()]);
        return { index, gunkel };
      });
    fetchAll().then(
      (result) => {
        if (current) setLoaded(result);
      },
      (reason: unknown) => {
        if (current) setError(reason);
      },
    );
    return () => {
      current = false;
    };
  }, [load]);

  if (error !== null) {
    return (
      <LoadError
        heading="Could not load similarity data"
        error={error}
        missingDataFiles="public/data/gunkel.json and public/data/compare.json"
      />
    );
  }
  if (loaded === null) return <p className={viz.loadError}>Loading similarity data…</p>;
  return (
    <CompareView
      navigate={navigate}
      index={loaded.index}
      gunkel={loaded.gunkel}
      loadMethod={methodLoader}
      {...(api === undefined ? {} : { api })}
    />
  );
}

/** The chosen method's matrix as it arrives: absent until fetched, then the payload or a failure. */
type MethodState =
  | { readonly status: "loading" }
  | { readonly status: "loaded"; readonly method: MethodPayload }
  | { readonly status: "failed" };

/** Fetches the chosen method's matrix, reporting loading until the result for that id lands. */
function useMethodPayload(
  meta: CompareMethodMeta,
  loadMethod: CompareMethodLoader,
): MethodState {
  const [landed, setLanded] = useState<{ id: string; load: CompareMethodLoad } | null>(null);
  useEffect(() => {
    let current = true;
    void loadMethod(meta.id).then((load) => {
      if (current) setLanded({ id: meta.id, load });
    });
    return () => {
      current = false;
    };
  }, [loadMethod, meta.id]);
  if (landed?.id !== meta.id) return { status: "loading" };
  if (landed.load.status !== "loaded") return { status: "failed" };
  return { status: "loaded", method: { ...landed.load.data, description: meta.description } };
}

/** The choice a page opens on: the index's default method, which the validator guarantees. */
function openingChoice(index: CompareIndex): ReturnType<typeof choiceOfMethod> {
  const method = index.methods.find((m) => m.id === index.defaultMethod) ?? index.methods[0];
  if (!method) throw new Error("Compare index carries no methods");
  return choiceOfMethod(method);
}

interface CompareViewProps {
  readonly navigate: NavigateHandler;
  readonly index: CompareIndex;
  readonly gunkel: GunkelPayload;
  readonly loadMethod: CompareMethodLoader;
  readonly api?: PlotApi;
}

/** Split from the loader so every hook below can assume the index is present. */
function CompareView({
  navigate,
  index,
  gunkel,
  loadMethod,
  api,
}: CompareViewProps): React.ReactElement {
  const [state, dispatch] = useReducer(reduceCompare, INITIAL_COMPARE_STATE);
  const [choice, choose] = useReducer(methodChoiceReducer, index, openingChoice);

  const families = useMemo(() => methodFamilies(index.methods), [index.methods]);
  const resolved = useMemo(() => resolveMethod(index.methods, choice), [index.methods, choice]);
  //: The validator rejects an empty method list, so a family with no methods still shows one.
  const meta: CompareMethodMeta = useMemo(() => {
    const found = resolved.method ?? index.methods[0];
    if (!found) throw new Error("Compare index carries no methods");
    return found;
  }, [resolved.method, index.methods]);

  const loading = useMethodPayload(meta, loadMethod);
  //: The dropdown and the head both read the settled model, never the one merely asked for.
  const selection = useMemo(
    () => ({ ...choice.selection, model: resolved.model }),
    [choice.selection, resolved.model],
  );

  const coloring = useMemo(
    () => createReferenceColoring(state.referenceColorMode, gunkel),
    [gunkel, state.referenceColorMode],
  );

  const selectPsalm = useCallback((psalm: number): void => {
    dispatch({ type: "SELECT_PSALM", psalm });
  }, []);

  return (
    <>
      <PageHeader current="compare" navigate={navigate} />

      <div className={layout.page}>
        <div className={layout.layout}>
          <PsalmPicker
            psalms={index.psalms}
            coloring={coloring}
            selected={state.selectedPsalm}
            onSelect={selectPsalm}
            onColorModeChange={(mode) => {
              dispatch({ type: "SET_REFERENCE_COLOR_MODE", mode });
            }}
          />

          <section className={viz.vizPanel} aria-label="Visualization">
            <VizHead subject="Compare" crumbs={headCrumbs(selection)} />
            {/* One band, the same shape the benchmark toolbar carries: the
                choices as dropdowns on the left, the view switch on the rail. */}
            <div className={band.band}>
              <ModelDropdown
                selection={selection}
                dispatch={choose}
                families={families}
                models={resolved.models}
                axes={axisLabels(meta)}
              >
                <MethodAxisRows resolved={resolved} dispatch={choose} />
              </ModelDropdown>
              <div className={band.bandYield}>
                <ViewTabs
                  tabs={TABS}
                  value={state.view}
                  onSelect={(view) => {
                    dispatch({ type: "SET_VIEW", view });
                  }}
                />
              </div>
            </div>
            <div className={viz.vizBody}>
              <p className={viz.viewHint}>{meta.description}</p>
              {loading.status === "loading" ? (
                <p className={viz.loadError}>Loading {meta.id}…</p>
              ) : null}
              {loading.status === "failed" ? (
                <p className={viz.loadError}>The matrix for {meta.id} could not be loaded.</p>
              ) : null}
              {/* Both views stay mounted: the network's force layout should not
                  restart, and the heatmap should not redraw, just to switch tabs. */}
              {loading.status === "loaded" ? (
                <>
                  <div role="tabpanel" hidden={state.view !== "matrix"}>
                    <Heatmap
                      method={loading.method}
                      onSelect={selectPsalm}
                      {...(api === undefined ? {} : { api })}
                    />
                  </div>
                  <div role="tabpanel" hidden={state.view !== "network"}>
                    <NetworkGraph
                      method={loading.method}
                      coloring={coloring}
                      selected={state.selectedPsalm}
                      onSelect={selectPsalm}
                      {...(api === undefined ? {} : { api })}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <DetailShell>
            {state.selectedPsalm === null || loading.status !== "loaded" ? (
              <EmptyDetail>
                Select a psalm from the grid or the visualization to see its closest matches.
              </EmptyDetail>
            ) : (
              <DetailPanel
                psalms={index.psalms}
                method={loading.method}
                psalmNumber={state.selectedPsalm}
                onSelectPsalm={selectPsalm}
              />
            )}
          </DetailShell>
        </div>
      </div>

      <PageFooter version={__APP_VERSION__} corpus={index.corpus} />
    </>
  );
}
