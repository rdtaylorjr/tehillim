import styles from "./ModelDetail.module.css";
import type { BenchmarkId } from "../../../shared/lib/catalog";

export interface ModelDetailProps {
  readonly model: string;
  readonly benchmark: BenchmarkId;
}

/** Placeholder visualization pane, standing in until the charts are wired up. */
export function ModelDetail({ model, benchmark }: ModelDetailProps): React.ReactElement {
  return (
    <div className={styles.vizPlaceholder}>
      <p className={styles.vizTitle}>
        {model} &middot; {benchmark}
      </p>
      <p className={styles.vizNote}>Charts for the current selection render here.</p>
    </div>
  );
}
