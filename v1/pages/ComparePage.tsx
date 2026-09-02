import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import layout from "../ui/Layout.module.css";
import viz from "../ui/VizPanel.module.css";
import { PageFooter, PageHeader } from "../ui/Layout";
import { PsalmPicker } from "../ui/PsalmPicker";
import { RepresentationSelector } from "../ui/RepresentationSelector";
import { LoadError, ViewTabs } from "../ui/VizPanel";
import { DetailPanel, DetailShell, EmptyDetail } from "../ui/DetailPanel";
import { Heatmap } from "../viz/Heatmap";
import { NetworkGraph } from "../viz/NetworkGraph";
import { loadGunkelData, loadSimilarityData } from "../api/loadPayloads";
import { createReferenceColoring } from "../lib/referenceColor";
import { initialCompareState, reduceCompare } from "../model/selection";
import type { ViewMode } from "../model/selection";
import type { GunkelPayload, MethodPayload, SimilarityPayload } from "../model/types";
import { routeSubtitle } from "../../shell/route";
import type { NavigateHandler } from "../../shell/Root";

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
}

export function ComparePage({ navigate, load }: ComparePageProps): React.ReactElement {
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
  return <CompareView navigate={navigate} data={loaded.data} gunkel={loaded.gunkel} />;
}

interface CompareViewProps {
  readonly navigate: NavigateHandler;
  readonly data: SimilarityPayload;
  readonly gunkel: GunkelPayload;
}

/** Split from the loader so every hook below can assume the payload is present
 * rather than guarding each one against a null it will never see again. */
function CompareView({ navigate, data, gunkel }: CompareViewProps): React.ReactElement {
  const [state, dispatch] = useReducer(reduceCompare, data.defaultMethod, initialCompareState);

  // The payload validator already rejects an empty method list, so the fallback
  // is for an id that no longer resolves, not for the list being empty.
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
      <PageHeader
        current="compare"
        subtitle={routeSubtitle("compare")}
        navigate={navigate}
        picker={
          <RepresentationSelector
            availableIds={methodIds}
            value={state.selectedMethodId}
            onChange={setMethod}
          />
        }
      />

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

          <section className={`${layout.panel} ${viz.vizPanel}`} aria-label="Visualization">
            <p className={viz.viewHint}>{method.description}</p>
            <ViewTabs
              tabs={TABS}
              value={state.view}
              onSelect={(view) => {
                dispatch({ type: "SET_VIEW", view });
              }}
            />
            {/* Both views stay mounted: the network's force layout should not
                restart, and the heatmap should not redraw, just to switch tabs. */}
            <div role="tabpanel" hidden={state.view !== "matrix"}>
              <Heatmap method={method} selected={state.selectedPsalm} onSelect={selectPsalm} />
            </div>
            <div role="tabpanel" hidden={state.view !== "network"}>
              <NetworkGraph
                method={method}
                coloring={coloring}
                selected={state.selectedPsalm}
                onSelect={selectPsalm}
              />
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
