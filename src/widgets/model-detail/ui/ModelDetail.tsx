import { useEffect, useState } from "react";
import styles from "./ModelDetail.module.css";
import { Message } from "../../../shared/ui/Message";
import { RowStats } from "./RowStats";
import { GenreSection } from "./sections/GenreSection";
import { ParallelismSection } from "./sections/ParallelismSection";
import { TrajectorySection } from "./sections/TrajectorySection";
import { createDetailLoader } from "../api/loadDetail";
import type { DetailLoad, DetailLoader } from "../api/loadDetail";
import { sectionFor } from "../lib/sectionFor";
import type { Selection } from "../../../shared/lib/selection";
import type { TableColumn } from "../../../shared/lib/results";

const defaultLoader = createDetailLoader();

export interface ModelDetailProps {
  readonly selection: Selection;
  readonly model: string;
  /** The clicked row and its columns, so the table's numbers travel in with the reader. */
  readonly row: Record<string, unknown> | null;
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
  /** Injected in tests so the charts can be driven without a network. */
  readonly load?: DetailLoader;
}

/** One model's charts: only the section the toolbar already chose, never a chooser of its own. */
export function ModelDetail({
  selection,
  model,
  row,
  columns,
  load = defaultLoader,
}: ModelDetailProps): React.ReactElement {
  const section = sectionFor(selection);
  const key = `${selection.family}/${model}/${section}`;
  const [state, setState] = useState<{ key: string; load: DetailLoad } | null>(null);

  useEffect(() => {
    let current = true;
    void load(selection.family, model, section).then((result) => {
      if (current) setState({ key, load: result });
    });
    return () => {
      current = false;
    };
  }, [load, selection.family, model, section, key]);

  // A result for a previous selection is stale, so the pane reads as loading until this one lands.
  if (state?.key !== key) return <Message>Loading {model}…</Message>;
  if (state.load.status === "absent") {
    return <Message>No detail export exists for {model} yet.</Message>;
  }
  if (state.load.status === "failed") {
    return <Message>Could not load the detail data for {model}.</Message>;
  }

  const data = state.load.data;
  return (
    <div className={styles.detail}>
      <RowStats row={row} columns={columns} />
      {section === "parallelism" && data.parallelism !== undefined ? (
        <ParallelismSection section={data.parallelism} />
      ) : null}
      {section === "genre" && data.genre !== undefined ? (
        <GenreSection section={data.genre} />
      ) : null}
      {section === "trajectory" && data.trajectory !== undefined ? (
        <TrajectorySection section={data.trajectory} />
      ) : null}
    </div>
  );
}
