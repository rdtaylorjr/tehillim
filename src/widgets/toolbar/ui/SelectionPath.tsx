import { Fragment } from "react";
import styles from "./Toolbar.module.css";
import { selectionPath } from "../../../shared/lib/path";
import type { Crumb } from "../../../shared/lib/path";
import type { Selection } from "../../../shared/lib/selection";

export interface SelectionPathProps {
  readonly selection: Selection;
  readonly onToggle: () => void;
}

const CLASS: Record<Crumb["kind"], string> = {
  major: styles.crumb,
  minor: `${styles.crumb} ${styles.dim}`,
  model: styles.crumbModel,
};

/** The crossed operator heads the path; every filter after it is introduced by a slash. */
function separator(kind: Crumb["kind"], first: boolean): React.ReactElement | null {
  if (first) return null;
  if (kind === "major") return <span className={styles.crumbX}>&times;</span>;
  // The model's slash is kept when the minors are culled, so two names never run together.
  return (
    <span className={`${styles.crumbSep}${kind === "model" ? ` ${styles.keep}` : ""}`}>/</span>
  );
}

/** The selection as one line, doubling as the control that folds the branch rows away. */
export function SelectionPath({ selection, onToggle }: SelectionPathProps): React.ReactElement {
  const crumbs = selectionPath(selection);
  const isDetail = selection.model !== null;
  return (
    <button
      type="button"
      className={styles.path}
      aria-expanded={isDetail ? undefined : !selection.collapsed}
      aria-label={isDetail ? undefined : "Toggle the model and benchmark rows"}
      onClick={() => {
        if (!isDetail) onToggle();
      }}
    >
      <span className={styles.crumbs}>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.kind}-${crumb.label}`}>
            {separator(crumb.kind, index === 0)}
            <span className={CLASS[crumb.kind]}>{crumb.label}</span>
          </Fragment>
        ))}
      </span>
      {isDetail ? null : (
        <svg
          className={styles.pathToggle}
          width="11"
          height="11"
          viewBox="0 0 11 11"
          aria-hidden="true"
        >
          <path
            d="M2 4l3.5 3.5L9 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
