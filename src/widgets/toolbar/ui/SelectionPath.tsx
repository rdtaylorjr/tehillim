import { Fragment } from "react";
import styles from "./Toolbar.module.css";
import { selectionPath } from "../../../shared/lib/navigation";
import type { Crumb } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";

export interface SelectionPathProps {
  readonly selection: Selection;
}

/** What qualifies the page name: the crossed trees, or the model on a detail page. */
function shownIn(selection: Selection): Crumb[] {
  const crumbs = selectionPath(selection);
  const model = crumbs.find((crumb) => crumb.kind === "model");
  return model === undefined ? crumbs.filter((crumb) => crumb.kind === "major") : [model];
}

/** The selection as one line, stating what is on screen and nothing more. */
export function SelectionPath({ selection }: SelectionPathProps): React.ReactElement {
  return (
    <span className={styles.crumbs}>
      {/* What the page IS leads, in the title face; what is selected qualifies
          it and is dimmed. The old order put every qualifier in front of the
          noun - "Semantic x Parallelism Benchmarks" - which reads backwards. */}
      <span className={styles.pageName}>Benchmark</span>
      {shownIn(selection).map((crumb, index) => (
        <Fragment key={`${crumb.kind}-${crumb.label}`}>
          {index === 0 ? null : <span className={styles.crumbX}>&times;</span>}
          <span className={styles.crumb}>{crumb.label}</span>
        </Fragment>
      ))}
    </span>
  );
}
