import styles from "../../../shared/ui/panel.module.css";
import { NAV_ROUTES, routeLabel, routePath } from "../../../../shell/route";
import type { NavigateHandler } from "../../../../shell/Root";
import type { Route } from "../../../../shell/route";
//: The site's permanent identity, which every route has to agree on.
import { SITE } from "../../../shared/lib/attribution";
import { formatCorpusCredit } from "../../../shared/lib/corpus";

export interface PageHeaderProps {
  readonly current: Route;
  /** Absent outside the router, where the nav links behave as ordinary hrefs. */
  readonly navigate?: NavigateHandler;
}

/** The one bar every page wears, carrying identity and wayfinding only. */
export function PageHeader({ current, navigate }: PageHeaderProps): React.ReactElement {
  return (
    <header className={styles.appHeader}>
      {/* The mark and the name are one link, and it goes home. That is where a
          reader already reaches for a way back to the front of a site, and it
          is why Home is not also a nav item. The mark used to point at the
          source repository; that link now sits in the footer, where an
          off-site destination belongs. */}
      <a
        className={styles.brand}
        href={routePath("home")}
        {...(current === "home" ? { "aria-current": "page" as const } : {})}
        {...(navigate === undefined
          ? {}
          : {
              onClick: (event: React.MouseEvent): void => {
                navigate("home", event);
              },
            })}
      >
        <span className={styles.brandMark} aria-hidden="true">
          ת
        </span>
        <span className={styles.titleBlock}>
          <h1 className={styles.titleName}>
            {/* Isolated so the bidi algorithm keeps the Hebrew to itself rather
                than dragging the punctuation and the English around it. */}
            <span className={styles.titleHebrew} lang="he" dir="rtl">
              {SITE.nameHebrew}
            </span>{" "}
            {SITE.name}
          </h1>
          <p className={styles.subtitle}>{SITE.scope}</p>
        </span>
      </a>
      <nav className={styles.pageNav} aria-label="Pages">
        {NAV_ROUTES.map((route) => (
          <a
            key={route}
            href={routePath(route)}
            {...(route === current ? { "aria-current": "page" as const } : {})}
            {...(navigate === undefined
              ? {}
              : {
                  onClick: (event: React.MouseEvent): void => {
                    navigate(route, event);
                  },
                })}
          >
            {routeLabel(route)}
          </a>
        ))}
      </nav>
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
