import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import layout from "../../../shared/ui/panel.module.css";
import viz from "../../../shared/ui/vizPanel.module.css";
import band from "../../../shared/ui/controlBand.module.css";
import { PageFooter, PageHeader } from "../../../widgets/layout";
import { PsalmPicker } from "../../../widgets/psalm-picker";
import { RepresentationSelector } from "../../../widgets/representation-selector";
import { Caption, Caveat, LoadError, VizHead, ViewTabs } from "../../../widgets/viz-panel";
import { ClusterDetailPanel, DetailShell, EmptyDetail } from "../../../widgets/detail-panel";
import { GenreAlignmentView } from "./GenreAlignmentView";
import { ScatterPlot } from "../charts/ScatterPlot";
import { loadClusteringData, loadGunkelData } from "../../../shared/api";
import { alignmentFor, selectedAlignmentCell } from "../../../shared/lib/results";
import { describeKStability } from "../lib/kStabilityConfidence";
import { describeScatterConfidence } from "../lib/scatterConfidence";
import { createReferenceColoring } from "../../../shared/lib/color";
import { featurePhrase } from "../../../shared/lib/corpus";
import type { ReferenceColorMode } from "../../../shared/lib/color";
import { initialClusterState, reduceCluster } from "../../../shared/model";
import type { ClusterViewMode } from "../../../shared/model";
import type {
  ClusteringPayload,
  ClusterMethodPayload,
  GunkelPayload,
} from "../../../shared/model";
import type { NavigateHandler } from "../../../../shell/Root";

const TABS: readonly { id: ClusterViewMode; label: string }[] = [
  { id: "alignment", label: "Genre Alignment" },
  { id: "scatter", label: "Scatter Plot" },
];

/** The gap statistic can choose k=1, where the views below are valid but empty. */
const NO_STRUCTURE =
  "This signal's cluster count is 1. The gap statistic found no cluster structure beyond what a structureless reference with the same similarity values would show. The scatter plot and genre alignment below are technically well-defined but trivial for a single cluster, not evidence of real structure.";

interface Loaded {
  readonly data: ClusteringPayload;
  readonly gunkel: GunkelPayload;
}

export interface ClusterPageProps {
  readonly navigate: NavigateHandler;
  /** Injected in tests so the page can be driven without a server. */
  readonly load?: () => Promise<Loaded>;
}

export function ClusterPage({ navigate, load }: ClusterPageProps): React.ReactElement {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let current = true;
    const fetchAll =
      load ??
      (async (): Promise<Loaded> => {
        const [data, gunkel] = await Promise.all([loadClusteringData(), loadGunkelData()]);
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
        heading="Could not load clustering data"
        error={error}
        missingDataFiles="public/data/clustering.json and public/data/gunkel.json"
      />
    );
  }
  if (loaded === null) return <p className={viz.loadError}>Loading clustering data…</p>;
  return <ClusterView navigate={navigate} data={loaded.data} gunkel={loaded.gunkel} />;
}

interface ClusterViewProps {
  readonly navigate: NavigateHandler;
  readonly data: ClusteringPayload;
  readonly gunkel: GunkelPayload;
}

/** Split from the loader so every hook below can assume the payload is present. */
function ClusterView({ navigate, data, gunkel }: ClusterViewProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    reduceCluster,
    data.defaultClusterMethod,
    initialClusterState,
  );

  //: The validator rejects an empty method list, so this covers a stale id.
  const method: ClusterMethodPayload = useMemo(() => {
    const found =
      data.clusterMethods.find((m) => m.id === state.selectedClusterMethodId) ??
      data.clusterMethods[0];
    if (!found) throw new Error("Clustering payload carries no methods");
    return found;
  }, [data.clusterMethods, state.selectedClusterMethodId]);

  const coloring = useMemo(
    () => createReferenceColoring(state.referenceColorMode, gunkel),
    [gunkel, state.referenceColorMode],
  );

  const methodIds = useMemo(() => data.clusterMethods.map((m) => m.id), [data.clusterMethods]);

  //: The picker's Gunkel scale, so the alluvial adds no second colour meaning.
  const genreColorOf = useMemo(() => {
    const granularity: ReferenceColorMode =
      state.referenceColorMode === "family" ? "family" : "genre";
    const colorByLabel = new Map(
      createReferenceColoring(granularity, gunkel).legend.map((e) => [e.label, e.color]),
    );
    return (genre: string): string => colorByLabel.get(genre) ?? "#6b6f76";
  }, [gunkel, state.referenceColorMode]);

  const alignment = useMemo(
    () => alignmentFor(method, state.referenceColorMode),
    [method, state.referenceColorMode],
  );

  const selectedCell = useMemo(
    () => selectedAlignmentCell(gunkel, method, state.referenceColorMode, state.selectedPsalm),
    [gunkel, method, state.referenceColorMode, state.selectedPsalm],
  );

  //: How settled the chosen k is, absent for a fixed_k method.
  const kStability = describeKStability(method.nClusters, method.kStability);

  //: Ties the chart's visual confidence to the numbers the alignment tab reports.
  const confidence = describeScatterConfidence(
    //: `varianceExplained` is the pre-rename name, still present in older payloads.
    method.embedding.structureCaptured ?? method.embedding.varianceExplained,
    alignment.ami,
    alignment.ari,
  );

  const selectPsalm = useCallback((psalm: number): void => {
    dispatch({ type: "SELECT_PSALM", psalm });
  }, []);

  const deselectPsalm = useCallback((): void => {
    dispatch({ type: "SELECT_PSALM", psalm: null });
  }, []);

  const setMethod = useCallback((methodId: string): void => {
    dispatch({ type: "SET_CLUSTER_METHOD", methodId });
  }, []);

  return (
    <>
      <PageHeader current="cluster" navigate={navigate} />

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

          <section className={viz.vizPanel} aria-label="Clustering results">
            <VizHead subject="Cluster" state={featurePhrase(method.id)} />
            {/* One band, the same shape the benchmark toolbar carries: the
                choices as dropdowns on the left, the view switch on the rail. */}
            <div className={band.band}>
              <RepresentationSelector
                availableIds={methodIds}
                value={state.selectedClusterMethodId}
                onChange={setMethod}
              />
              <div className={band.bandYield}>
                <ViewTabs
                  tabs={TABS}
                  value={state.clusterView}
                  onSelect={(view) => {
                    dispatch({ type: "SET_CLUSTER_VIEW", view });
                  }}
                />
              </div>
            </div>
            <div className={viz.vizBody}>
              <p className={viz.viewHint}>{method.description}</p>
              {method.nClusters <= 1 ? <Caveat>{NO_STRUCTURE}</Caveat> : null}
              {kStability ? (
                <Caption level={kStability.level}>{kStability.message}</Caption>
              ) : null}

              <div role="tabpanel" hidden={state.clusterView !== "alignment"}>
                <GenreAlignmentView
                  alignment={alignment}
                  genreColorOf={genreColorOf}
                  selected={selectedCell}
                  clusterMethodId={method.id}
                />
              </div>
              {/* Kept mounted so switching tabs never restarts the layout. */}
              <div role="tabpanel" hidden={state.clusterView !== "scatter"}>
                <ScatterPlot
                  psalms={data.psalms}
                  method={method}
                  coloring={coloring}
                  selected={state.selectedPsalm}
                  lowConfidence={confidence.level === "low"}
                  onSelect={selectPsalm}
                  onDeselect={deselectPsalm}
                />
                <Caption level={confidence.level}>{confidence.message}</Caption>
              </div>
            </div>
          </section>

          <DetailShell>
            {state.selectedPsalm === null ? (
              <EmptyDetail>
                Select a psalm from the grid to see its cluster and fellow members.
              </EmptyDetail>
            ) : (
              <ClusterDetailPanel
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
