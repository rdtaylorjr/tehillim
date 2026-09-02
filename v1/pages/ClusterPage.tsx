import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import layout from "../ui/Layout.module.css";
import viz from "../ui/VizPanel.module.css";
import { PageFooter, PageHeader } from "../ui/Layout";
import { PsalmPicker } from "../ui/PsalmPicker";
import { RepresentationSelector } from "../ui/RepresentationSelector";
import { Caption, Caveat, LoadError, ViewTabs } from "../ui/VizPanel";
import { ClusterDetailPanel, DetailShell, EmptyDetail } from "../ui/DetailPanel";
import { GenreAlignmentView } from "../ui/GenreAlignmentView";
import { ScatterPlot } from "../viz/ScatterPlot";
import { loadClusteringData, loadGunkelData } from "../api/loadPayloads";
import { alignmentFor, selectedAlignmentCell } from "../lib/alignmentCell";
import { describeKStability } from "../lib/kStabilityConfidence";
import { describeScatterConfidence } from "../lib/scatterConfidence";
import { createReferenceColoring } from "../lib/referenceColor";
import type { ReferenceColorMode } from "../lib/referenceColor";
import { initialClusterState, reduceCluster } from "../model/selection";
import type { ClusterViewMode } from "../model/selection";
import type { ClusteringPayload, ClusterMethodPayload, GunkelPayload } from "../model/types";
import { routeSubtitle } from "../../shell/route";
import type { NavigateHandler } from "../../shell/Root";

const TABS: readonly { id: ClusterViewMode; label: string }[] = [
  { id: "alignment", label: "Genre Alignment" },
  { id: "scatter", label: "Scatter Plot" },
];

/** The gap statistic can legitimately choose k=1 - "no cluster structure beyond
 * what a same-value-distribution structureless reference would show" - unlike
 * silhouette, which is undefined at k=1 and so could never say that on its own.
 * The views below still render for k=1 (a single trivial cluster is
 * well-defined), but they have nothing real to show, so this says so plainly
 * rather than letting a technically-valid, meaningless chart stand in for a
 * result. */
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

/** Split from the loader so every hook below can assume the payload is present
 * rather than guarding each one against a null it will never see again. */
function ClusterView({ navigate, data, gunkel }: ClusterViewProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    reduceCluster,
    data.defaultClusterMethod,
    initialClusterState,
  );

  // The payload validator already rejects an empty method list, so the fallback
  // is for an id that no longer resolves, not for the list being empty.
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

  // The alluvial's genre axis needs a name -> color lookup, always at Gunkel
  // granularity (never "book" - the same fallback alignmentFor already uses,
  // since a genre-alignment view has no book axis to color by). Reusing the
  // picker's own scale means these colors are always identical to whatever the
  // picker shows whenever it is in a Gunkel mode - the alluvial never
  // introduces a second, competing color meaning.
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

  // How settled this signal's data-chosen cluster count actually is - silhouette
  // score alone reports one winning k with no sense of whether a different
  // corpus resample would have picked another. Absent entirely for a fixed_k
  // method, since there is nothing to report.
  const kStability = describeKStability(method.nClusters, method.kStability);

  // A clean-looking scatter plot can still carry almost no real signal (a
  // partition statistically indistinguishable from a random one). This ties the
  // chart's visual confidence to the same numbers the Genre Alignment tab
  // already reports, rather than leaving "looks clean" and "is real" decoupled
  // across two tabs a reader might not both open.
  const confidence = describeScatterConfidence(
    // `varianceExplained` is the pre-rename name for the same quantity, so an
    // older payload still reports what it recorded rather than nothing.
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
      <PageHeader
        current="cluster"
        subtitle={routeSubtitle("cluster")}
        navigate={navigate}
        picker={
          <RepresentationSelector
            availableIds={methodIds}
            value={state.selectedClusterMethodId}
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

          <section
            className={`${layout.panel} ${viz.vizPanel}`}
            aria-label="Clustering results"
          >
            <p className={viz.viewHint}>{method.description}</p>
            {method.nClusters <= 1 ? <Caveat>{NO_STRUCTURE}</Caveat> : null}
            {kStability ? (
              <Caption level={kStability.level}>{kStability.message}</Caption>
            ) : null}

            <ViewTabs
              tabs={TABS}
              value={state.clusterView}
              onSelect={(view) => {
                dispatch({ type: "SET_CLUSTER_VIEW", view });
              }}
            />

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
