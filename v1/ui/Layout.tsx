import styles from "./Layout.module.css";
import { routePath } from "../../shell/route";
import type { NavigateHandler } from "../../shell/Root";
import type { Route } from "../../shell/route";
// The one exception to this tree's separation from src/: the site's permanent
// identity, which by definition every route has to agree on. It is a constants
// module with no behaviour, and its own comment already sets `name`/`scope`
// apart from "the subtitle a later phase replaces" - these pages are that
// phase. Duplicating the strings here would recreate exactly the drift this
// import prevents.
import { SITE } from "../../src/shared/lib/attribution";
import { formatCorpusCredit } from "../lib/corpusCredit";

const PAGES: readonly { route: Extract<Route, "compare" | "cluster">; label: string }[] = [
  { route: "compare", label: "Compare" },
  { route: "cluster", label: "Cluster" },
];

export interface PageHeaderProps {
  readonly current: Extract<Route, "compare" | "cluster">;
  readonly subtitle: string;
  readonly navigate: NavigateHandler;
  /** The representation picker, which each page builds from its own method list. */
  readonly picker: React.ReactNode;
}

/** The bar both v1 pages share: identity, what this page shows, the two pages,
 * and the picker for whichever representation is on screen. */
export function PageHeader({
  current,
  subtitle,
  navigate,
  picker,
}: PageHeaderProps): React.ReactElement {
  return (
    <header className={styles.appHeader}>
      <a
        className={styles.brand}
        href="https://github.com/rdtaylorjr/tehillim"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View source on GitHub"
      >
        <span className={styles.brandMark} aria-hidden="true">
          ת
        </span>
      </a>
      <div className={styles.titleBlock}>
        <h1>
          <span className={styles.titleName}>{SITE.name}</span>{" "}
          <span className={styles.titleScope}>{SITE.scope}</span>
        </h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <nav className={styles.pageNav} aria-label="Pages">
        {PAGES.map((page) => (
          <a
            key={page.route}
            href={routePath(page.route)}
            {...(page.route === current ? { "aria-current": "page" as const } : {})}
            onClick={(event) => {
              navigate(page.route, event);
            }}
          >
            {page.label}
          </a>
        ))}
      </nav>
      <div className={styles.methodPicker}>{picker}</div>
    </header>
  );
}

export interface PageFooterProps {
  readonly version: string;
  readonly corpus: { readonly name: string; readonly version: string };
}

/** One line: this build, and the corpus every number on the page came from. */
export function PageFooter({ version, corpus }: PageFooterProps): React.ReactElement {
  return (
    <footer className={styles.siteFooter}>
      <span>v{version}</span>
      <span className={styles.footerSep}>&middot;</span>
      <span>{formatCorpusCredit(corpus.name, corpus.version)}</span>
    </footer>
  );
}
