import styles from "../../../shared/ui/vizPanel.module.css";

export interface VizHeadProps {
  /** The page name, exactly as its nav tab reads it. */
  readonly subject: string;
  /** What is on screen right now, which qualifies the name rather than replacing it. */
  readonly state: string;
}

/** The panel head: the page name in the title face, then the selection, dimmed. */
export function VizHead({ subject, state }: VizHeadProps): React.ReactElement {
  return (
    <div className={styles.vizHead}>
      <span className={styles.vizSubject}>
        <span className={styles.vizName}>{subject}</span>
        <span className={styles.vizState}>{state}</span>
      </span>
    </div>
  );
}

export interface ViewTab<T extends string> {
  readonly id: T;
  readonly label: string;
}

export interface ViewTabsProps<T extends string> {
  readonly tabs: readonly ViewTab<T>[];
  readonly value: T;
  readonly onSelect: (id: T) => void;
}

/** The one-of-a-few switch above each page's plots. */
export function ViewTabs<T extends string>({
  tabs,
  value,
  onSelect,
}: ViewTabsProps<T>): React.ReactElement {
  return (
    <div className={styles.viewTabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === value}
          className={`${styles.viewTab}${tab.id === value ? ` ${styles.isActive}` : ""}`}
          onClick={() => {
            onSelect(tab.id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export interface CaveatProps {
  readonly children: React.ReactNode;
}

/** Read the numbers below with this specific caution in mind. */
export function Caveat({ children }: CaveatProps): React.ReactElement {
  return <p className={styles.caveatBadge}>{children}</p>;
}

export interface CaptionProps {
  readonly children: React.ReactNode;
  /** Ties the caption's weight to how much the reader should doubt the chart. */
  readonly level?: "good" | "high" | "moderate" | "low";
}

/** A statement about how far the chart above it can be trusted. */
export function Caption({ children, level = "good" }: CaptionProps): React.ReactElement {
  const tone =
    level === "moderate" ? ` ${styles.isModerate}` : level === "low" ? ` ${styles.isLow}` : "";
  return <p className={`${styles.viewCaption}${tone}`}>{children}</p>;
}

export interface LoadErrorProps {
  readonly heading: string;
  readonly error: unknown;
  readonly missingDataFiles: string;
}

/** Shown in place of a page whose initial data fetch failed. */
export function LoadError({
  heading,
  error,
  missingDataFiles,
}: LoadErrorProps): React.ReactElement {
  return (
    <div className={styles.loadError} role="alert">
      <h1>{heading}</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
      <p>
        Run the pipeline (see the tehillim-clustering README) to generate {missingDataFiles}.
      </p>
    </div>
  );
}
