import { useEffect, useReducer, useState } from "react";
import styles from "./App.module.css";
import { Message } from "../shared/ui/Message";
import { SITE } from "../shared/lib/attribution";
import { INITIAL_SELECTION, selectionReducer } from "../shared/lib/selection";
import type { Selection } from "../shared/lib/selection";
import { createDomainCache, createTrajectorySliceCache } from "../shared/api";
import type { DomainLoad, TrajectorySliceLoader } from "../shared/api";
import type { DomainData } from "../shared/lib/results";
import { familyFor } from "../shared/lib/catalog";
import type { FamilyId } from "../shared/lib/catalog";
import { Toolbar } from "../widgets/toolbar";
import { BenchmarkTable } from "../widgets/benchmark-table";
import { ModelDetail } from "../widgets/model-detail";
import { Footer } from "../widgets/footer";

export interface AppProps {
  /** Injected in tests so the page can be driven without a server. */
  readonly load?: (family: FamilyId) => Promise<DomainLoad>;
  readonly loadSlice?: TrajectorySliceLoader;
}

/** Only the per-genre trajectory view reads the rows that ship separately. */
function needsTrajectorySlice(selection: Selection): boolean {
  return (
    selection.benchmark === "genre" && selection.metric !== "genre" && selection.genre !== "all"
  );
}

interface ResultsPaneProps {
  readonly result: DomainLoad | null;
  /** Fetched apart from the rest of the family, so it arrives on its own schedule. */
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
export function App({ load, loadSlice }: AppProps = {}): React.ReactElement {
  const [selection, dispatch] = useReducer(selectionReducer, INITIAL_SELECTION);
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

  // Carrying the family with its result makes a previous family's rows unusable rather than stale.
  const result = loaded?.family === selection.family ? loaded.result : null;
  const sliceRows = slice?.key === sliceKey ? slice.rows : [];

  return (
    <>
      <header className={styles.appHeader}>
        <span className={styles.brandMark} aria-hidden="true">
          ת
        </span>
        <div className={styles.titleBlock}>
          <h1>
            <span className={styles.titleName}>{SITE.name}</span>
            <span className={styles.titleScope}> {SITE.scope}</span>
          </h1>
          <p className={styles.subtitle}>{SITE.subtitle}</p>
        </div>
      </header>

      <div className={styles.page}>
        <main className={styles.panel}>
          <Toolbar selection={selection} dispatch={dispatch} />
          {selection.model !== null ? (
            <ModelDetail model={selection.model} benchmark={selection.benchmark} />
          ) : (
            <ResultsPane
              result={result}
              trajectoryByGenre={sliceRows}
              selection={selection}
              onOpenModel={(model) => {
                dispatch({ type: "model/selected", model });
              }}
            />
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
