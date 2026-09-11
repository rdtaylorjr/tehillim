import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import layout from "../../../shared/ui/panel.module.css";
import viz from "../../../shared/ui/vizPanel.module.css";
import band from "../../../shared/ui/controlBand.module.css";
import { PageFooter, PageHeader } from "../../../widgets/layout";
import { PsalmPicker } from "../../../widgets/psalm-picker";
import { RepresentationSelector } from "../../../widgets/representation-selector";
import { LoadError, VizHead, ViewTabs } from "../../../widgets/viz-panel";
import { DetailPanel, DetailShell, EmptyDetail } from "../../../widgets/detail-panel";
import { Heatmap } from "../charts/Heatmap";
import { NetworkGraph } from "../charts/NetworkGraph";
import { loadGunkelData, loadSimilarityData } from "../../../shared/api";
import { createReferenceColoring } from "../../../shared/lib/color";
import { featurePhrase } from "../../../shared/lib/corpus";
import { initialCompareState, reduceCompare } from "../../../shared/model";
import type { ViewMode } from "../../../shared/model";
import type { GunkelPayload, MethodPayload, SimilarityPayload } from "../../../shared/model";
import type { PlotApi } from "../../../shared/charts";
import type { NavigateHandler } from "../../../../shell/Root";

const TABS: readonly { id: ViewMode; label: string }[] = [
  { id: "matrix", label: "Similarity Matrix" },
  { id: "network", label: "Network Graph" },
];

interface Loaded {
  readonly data: SimilarityPayload;
  readonly gunkel: GunkelPayload;
}

export interface ComparePageProps {
  readonly navigate: NavigateHandler;
  /** Injected in tests so the page can be driven without a server. */
  readonly load?: () => Promise<Loaded>;
  /** Injected in tests so the views render without a real Plotly canvas. */
  readonly api?: PlotApi;
}

export function ComparePage({ navigate, load, api }: ComparePageProps): React.ReactElement {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let current = true;
    const fetchAll =
      load ??
      (async (): Promise<Loaded> => {
        const [data, gunkel] = await Promise.all([loadSimilarityData(), loadGunkelData()]);
        return { data, gunkel };
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
        missingDataFiles="public/data/gunkel.json and the similarity payload"
      />
    );
  }
  if (loaded === null) return <p className={viz.loadError}>Loading similarity data…</p>;
  return (
    <CompareView
      navigate={navigate}
      data={loaded.data}
      gunkel={loaded.gunkel}
      {...(api === undefined ? {} : { api })}
    />
  );
}

interface CompareViewProps {
  readonly navigate: NavigateHandler;
  readonly data: SimilarityPayload;
  readonly gunkel: GunkelPayload;
  readonly api?: PlotApi;
}

/** Split from the loader so every hook below can assume the payload is present. */
function CompareView({ navigate, data, gunkel, api }: CompareViewProps): React.ReactElement {
  const [state, dispatch] = useReducer(reduceCompare, data.defaultMethod, initialCompareState);

  //: The validator rejects an empty method list, so this covers a stale id.
  const method: MethodPayload = useMemo(() => {
    const found = data.methods.find((m) => m.id === state.selectedMethodId) ?? data.methods[0];
    if (!found) throw new Error("Similarity payload carries no methods");
    return found;
  }, [data.methods, state.selectedMethodId]);

  const coloring = useMemo(
    () => createReferenceColoring(state.referenceColorMode, gunkel),
    [gunkel, state.referenceColorMode],
  );

  const methodIds = useMemo(() => data.methods.map((m) => m.id), [data.methods]);

  const selectPsalm = useCallback((psalm: number): void => {
    dispatch({ type: "SELECT_PSALM", psalm });
  }, []);

  const setMethod = useCallback((methodId: string): void => {
    dispatch({ type: "SET_METHOD", methodId });
  }, []);

  return (
    <>
      <PageHeader current="compare" navigate={navigate} />

      <div className={layout.page}>
        <div className={layout.layout}>
          <PsalmPicker
            psalms={data.psalms}
            coloring={coloring}
            selected={state.selectedPsalm}
            onSelect={selectPsalm}
            onColorModeChange={(mode) => {
              dispatch({ type: "SET_REFERENCE_COLOR_MODE", mode });
            }}
          />

          <section className={viz.vizPanel} aria-label="Visualization">
            <VizHead subject="Compare" state={featurePhrase(method.id)} />
            {/* One band, the same shape the benchmark toolbar carries: the
                choices as dropdowns on the left, the view switch on the rail. */}
            <div className={band.band}>
              <RepresentationSelector
                availableIds={methodIds}
                value={state.selectedMethodId}
                onChange={setMethod}
              />
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
              <p className={viz.viewHint}>{method.description}</p>
              {/* Both views stay mounted: the network's force layout should not
                  restart, and the heatmap should not redraw, just to switch tabs. */}
              <div role="tabpanel" hidden={state.view !== "matrix"}>
                <Heatmap
                  method={method}
                  onSelect={selectPsalm}
                  {...(api === undefined ? {} : { api })}
                />
              </div>
              <div role="tabpanel" hidden={state.view !== "network"}>
                <NetworkGraph
                  method={method}
                  coloring={coloring}
                  selected={state.selectedPsalm}
                  onSelect={selectPsalm}
                  {...(api === undefined ? {} : { api })}
                />
              </div>
            </div>
          </section>

          <DetailShell>
            {state.selectedPsalm === null ? (
              <EmptyDetail>
                Select a psalm from the grid or the visualization to see its closest matches.
              </EmptyDetail>
            ) : (
              <DetailPanel
                psalms={data.psalms}
                method={method}
                psalmNumber={state.selectedPsalm}
                onSelectPsalm={selectPsalm}
              />
            )}
          </DetailShell>
        </div>
      </div>

      <PageFooter version={__APP_VERSION__} corpus={data.corpus} />
    </>
  );
}
