import { Fragment } from "react";
import styles from "./vizPanel.module.css";
import type { Crumb } from "../lib/navigation";

export interface VizHeadProps {
  /** The page name, exactly as its nav tab reads it. */
  readonly subject: string;
  /** What qualifies the name: the crossed trees, or the open model. */
  readonly crumbs: readonly Crumb[];
  /** Controls seated on the rail beside the name. */
  readonly children?: React.ReactNode;
}

/** The panel head: the page name in the title face, then the selection, dimmed. */
export function VizHead({ subject, crumbs, children }: VizHeadProps): React.ReactElement {
  return (
    <div className={styles.vizHead}>
      <span className={styles.vizSubject}>
        <span className={styles.vizName}>{subject}</span>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.kind}-${crumb.label}`}>
            {index === 0 ? null : <span className={styles.vizCrumbX}>&times;</span>}
            <span className={styles.vizCrumb}>{crumb.label}</span>
          </Fragment>
        ))}
      </span>
      {children}
    </div>
  );
}
