import styles from "./Message.module.css";

export interface MessageProps {
  readonly children: React.ReactNode;
  /** Announces the message to assistive technology, for a failure the reader did not cause. */
  readonly alert?: boolean;
}

/** A stated reason there is nothing to show, in place of the thing that would have been shown. */
export function Message({ children, alert = false }: MessageProps): React.ReactElement {
  return (
    <p className={styles.emptyState} role={alert ? "alert" : undefined}>
      {children}
    </p>
  );
}
