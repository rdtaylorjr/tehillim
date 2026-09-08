import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import styles from "./App.module.css";
import { Message } from "../shared/ui/Message";
import { INITIAL_SELECTION, selectionReducer } from "../shared/lib/navigation";
import type { Selection } from "../shared/lib/navigation";
import { createDomainCache, createTrajectorySliceCache } from "../shared/api";
import type { DomainLoad, TrajectorySliceLoader } from "../shared/api";
import { listsModel } from "../shared/lib/results";
import type { DomainData } from "../shared/lib/results";
import { MODEL_FAMILIES, familyFor } from "../shared/lib/corpus";
import type { FamilyId } from "../shared/lib/corpus";
import { Toolbar } from "../widgets/toolbar";
import { BenchmarkTable, clickedRow, modelNames } from "../widgets/benchmark-table";
// Plotly is several megabytes, and the table needs none of it, so the charts load on first use.
interface ModelDetailModule {
  readonly ModelDetail: (props: ModelDetailProps) => React.ReactElement;
}

const importModelDetail = async (): Promise<ModelDetailModule> =>
  import("../widgets/model-detail");

const ModelDetail = lazy(async () => {
  const loaded = await importModelDetail();
  return { default: loaded.ModelDetail };
});
import type { DetailLoader, ModelDetailProps } from "../widgets/model-detail";
import { Footer } from "../widgets/footer";
import { PageHeader } from "../widgets/layout";
import type { NavigateHandler } from "../../shell/Root";

export interface AppProps {
  /** Supplied by the router. Absent when the page is mounted alone. */
  readonly navigate?: NavigateHandler;
  /** The model the URL asks for, and the way to change it. */
  readonly model?: string | null;
  readonly onOpenModel?: (model: string | null) => void;
  /** Injected in tests so the page can be driven without a server. */
  readonly load?: (family: FamilyId) => Promise<DomainLoad>;
  readonly loadSlice?: TrajectorySliceLoader;
  readonly loadDetail?: DetailLoader;
}

/** Only the per-genre trajectory view reads the rows that ship separately. */
function needsTrajectorySlice(selection: Selection): boolean {
  return (
    selection.benchmark === "genre" && selection.metric !== "genre" && selection.genre !== "all"
  );
}

interface ResultsPaneProps {
  readonly result: DomainLoad | null;
  /** Fetched apart from the rest of the family, so it arrives on a separate schedule. */
  readonly trajectoryByGenre: DomainData["trajectory_by_genre"];
  readonly selection: Selection;
  readonly onOpenModel: (model: string) => void;
}

/** What sits under the toolbar: the results, or the reason there are none. */
function ResultsPane({
  result,
  trajectoryByGenre,
  selection,
  onOpenModel,
}: ResultsPaneProps): React.ReactElement {
  if (result === null) return <Message>Loading results\u2026</Message>;
  if (result.status === "absent") {
    return (
      <Message>
        No benchmark has been run for {familyFor(selection.family).label} models yet.
      </Message>
    );
  }
  if (result.status === "failed") {
    return (
      <p className="empty-state" role="alert">
        The results for {familyFor(selection.family).label} models could not be loaded. They
        exist, so this is a problem reaching them rather than an absence of findings.
      </p>
    );
  }
  const data = { ...result.data, trajectory_by_genre: trajectoryByGenre };
  return <BenchmarkTable selection={selection} data={data} onOpenModel={onOpenModel} />;
}

/** The whole page: one persistent toolbar, and one pane below it that swaps. */
export function App({
  navigate,
  model: routedModel,
  onOpenModel,
  load,
  loadSlice,
  loadDetail,
}: AppProps = {}): React.ReactElement {
  const [selection, dispatch] = useReducer(selectionReducer, INITIAL_SELECTION);

  //: With a router above, the URL owns the choice and this flows it down.
  const routed = onOpenModel !== undefined;

  useEffect(() => {
    if (!routed) return;
    dispatch({ type: "model/selected", model: routedModel ?? null });
  }, [routed, routedModel]);

  //: Which model, and the URL with it. Leaves the view alone.
  const setModel = useCallback(
    (next: string | null): void => {
      if (onOpenModel !== undefined) onOpenModel(next);
      else dispatch({ type: "model/selected", model: next });
    },
    [onOpenModel],
  );

  /** Opening a row from the table is both: this model, and the view that shows it. */
  const openModel = useCallback(
    (next: string): void => {
      dispatch({ type: "view/selected", view: "detail" });
      setModel(next);
    },
    [setModel],
  );
  // One cache per mounted page rather than a module-level singleton outliving it.
  const [fallbackLoad] = useState(() => createDomainCache());
  const [fallbackSlice] = useState(() => createTrajectorySliceCache());
  const loadFamily = load ?? fallbackLoad;
  const loadTrajectory = loadSlice ?? fallbackSlice;
  const [slice, setSlice] = useState<{
    key: string;
    rows: DomainData["trajectory_by_genre"];
  } | null>(null);
  const [loaded, setLoaded] = useState<{ family: FamilyId; result: DomainLoad } | null>(null);

  useEffect(() => {
    let current = true;
    void loadFamily(selection.family).then((result) => {
      // A slower earlier request must not overwrite the family the reader has since chosen.
      if (current) setLoaded({ family: selection.family, result });
    });
    return () => {
      current = false;
    };
  }, [loadFamily, selection.family]);

  const sliceKey = `${selection.family}/${selection.metric}`;
  const wantsSlice = needsTrajectorySlice(selection);

  useEffect(() => {
    if (!wantsSlice) return undefined;
    let current = true;
    void loadTrajectory(selection.family, selection.metric).then((rows) => {
      if (current) setSlice({ key: sliceKey, rows });
    });
    return () => {
      current = false;
    };
  }, [loadTrajectory, selection.family, selection.metric, sliceKey, wantsSlice]);

  // The charts weigh far more than the table, so they are fetched while the reader reads the table.
  useEffect(() => {
    const warm = (): void => {
      void importModelDetail();
    };
    // Safari only gained requestIdleCallback recently, so a timer stands in where it is absent.
    if (typeof requestIdleCallback !== "function") {
      const timer = setTimeout(warm, 300);
      return () => {
        clearTimeout(timer);
      };
    }
    const idle = requestIdleCallback(warm);
    return () => {
      cancelIdleCallback(idle);
    };
  }, []);

  // Carrying the family with its result makes a previous family's rows unusable rather than stale.
  const result = loaded?.family === selection.family ? loaded.result : null;
  const sliceRows = useMemo(
    () => (slice?.key === sliceKey ? slice.rows : []),
    [slice, sliceKey],
  );
  // The detail view restates the row's numbers, so they are derived here rather than duplicated in state.
  const opened =
    result?.status === "loaded" ? clickedRow(result.data, selection, sliceRows) : null;
  // The rung below the group, for the toolbar's Model control on a detail page.
  const models = useMemo(
    () => (result?.status === "loaded" ? modelNames(result.data, selection, sliceRows) : []),
    [result, selection, sliceRows],
  );
  const firstModel = models[0];
  //: What matters is whether the selection still holds the model, not whether it was cleared.
  const openStillListed = selection.model !== null && models.includes(selection.model);

  //: Which models a selection holds is unknown until its rows are in.
  const settled = result !== null && (!wantsSlice || sliceRows.length > 0);

  //: A model URL names no family, so a direct load searches the others for the one listing it.
  //: Held in a ref: writing it as state would re-run this effect and cancel its own search.
  const probedModel = useRef<string | null>(null);
  const [placing, setPlacing] = useState(false);
  useEffect(() => {
    const target = routedModel;
    if (!routed || target === null || target === undefined || !settled) return;
    if (models.includes(target) || probedModel.current === target) return;
    probedModel.current = target;
    //: An object rather than a boolean, so the cleanup's write is visible to the closure.
    const run = { live: true };
    setPlacing(true);
    void (async () => {
      for (const { id } of MODEL_FAMILIES) {
        if (id === selection.family) continue;
        const found = await loadFamily(id);
        if (!run.live) return;
        if (found.status === "loaded" && listsModel(found.data, target)) {
          dispatch({ type: "family/selected", family: id });
          break;
        }
      }
      if (run.live) setPlacing(false);
    })();
    return () => {
      run.live = false;
      //: An abandoned search must not leave the fallback disabled, so it is retryable.
      if (probedModel.current === target) probedModel.current = null;
      setPlacing(false);
    };
  }, [routed, routedModel, settled, models, loadFamily, selection.family]);

  //: The open model belonged to the selection just left, so the new one opens its first.
  useEffect(() => {
    if (selection.view !== "detail" || openStillListed || !settled) return;
    //: A routed model still being placed in its family must not be replaced mid-search.
    if (placing) return;
    //: The view is left alone, and the URL is cleared so it names nothing stale.
    setModel(firstModel ?? null);
  }, [selection.view, openStillListed, firstModel, settled, setModel, placing]);

  return (
    <>
      <PageHeader current="benchmark" {...(navigate === undefined ? {} : { navigate })} />

      <div className={styles.page}>
        <main className={styles.panel}>
          <Toolbar
            selection={selection}
            dispatch={dispatch}
            models={models}
            onView={(view) => {
              //: The effect above opens the first model the selection holds.
              dispatch({ type: "view/selected", view });
              if (view === "table") setModel(null);
            }}
          />
          {selection.model !== null ? (
            <Suspense fallback={<Message>Loading charts…</Message>}>
              <ModelDetail
                selection={selection}
                model={selection.model}
                row={opened?.row ?? null}
                columns={opened?.columns ?? []}
                {...(loadDetail === undefined ? {} : { load: loadDetail })}
              />
            </Suspense>
          ) : (
            <ResultsPane
              result={result}
              trajectoryByGenre={sliceRows}
              selection={selection}
              onOpenModel={openModel}
            />
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
