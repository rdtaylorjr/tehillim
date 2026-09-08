import { useCallback, useEffect, useMemo, useState } from "react";
import layout from "../../../shared/ui/panel.module.css";
import field from "../../../shared/ui/Field.module.css";
import styles from "./ReferencesPage.module.css";
import { PageHeader } from "../../../widgets/layout";
import { Footer } from "../../../widgets/footer";
import { REFERENCES_BIB_URL, loadReferences } from "../api/loadReferences";
import { countWorks, filterSections, termsOf } from "../lib/filter";
import type { Reference, ReferenceSection, ReferencesPayload } from "../model/types";
import type { NavigateHandler } from "../../../../shell/Root";

/** Every work here is published elsewhere, so each link leaves the app. */
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

/** What the reader asked to see, both null meaning the whole bibliography. */
interface Scope {
  readonly category: string | null;
  readonly sub: string | null;
}

const ALL: Scope = { category: null, sub: null };

/** One citation in author-date form, every string composed by the generator. */
function Entry({ reference }: { readonly reference: Reference }): React.ReactElement {
  const titled =
    reference.titleStyle === "italic" ? (
      <span className={styles.workTitle}>{reference.title}</span>
    ) : (
      <>&ldquo;{reference.title}.&rdquo;</>
    );
  return (
    <li className={styles.entry}>
      {reference.creators === "" ? null : (
        <span className={styles.creators}>{reference.creators} </span>
      )}
      <span className={styles.year}>{reference.year ?? reference.date}. </span>
      {reference.url === "" ? (
        titled
      ) : (
        <a className={styles.titleLink} href={reference.url} {...EXTERNAL}>
          {titled}
        </a>
      )}
      {reference.titleStyle === "italic" ? ". " : " "}
      {reference.container === "" ? null : (
        <>
          {reference.containerPrefix}
          <span className={styles.container}>{reference.container}</span>
        </>
      )}
      {reference.detail === "" ? null : (
        <>
          {reference.container === "" ? "" : ", "}
          {reference.detail}
        </>
      )}
      {reference.container === "" && reference.detail === "" ? null : "."}
      <span className={styles.kind}>{reference.type}</span>
    </li>
  );
}

/** Distinct works in a section, since one work can be filed in two of its runs. */
function totalIn(section: ReferenceSection): number {
  return new Set(section.groups.flatMap((g) => g.entries.map((e) => e.id))).size;
}

export interface ReferencesPageProps {
  readonly navigate?: NavigateHandler;
  /** Injected in tests so the page can be driven without a server. */
  readonly load?: () => Promise<ReferencesPayload>;
}

/** The sources behind the other three pages, the selector holding still beside them. */
export function ReferencesPage({ navigate, load }: ReferencesPageProps): React.ReactElement {
  const [payload, setPayload] = useState<ReferencesPayload | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>(ALL);

  useEffect(() => {
    let current = true;
    (load ?? (() => loadReferences()))().then(
      (result) => {
        if (current) setPayload(result);
      },
      (reason: unknown) => {
        if (current) setError(reason);
      },
    );
    return () => {
      current = false;
    };
  }, [load]);

  const terms = useMemo(() => termsOf(query), [query]);
  const sections = useMemo(
    () => (payload ? filterSections(payload.sections, terms) : []),
    [payload, terms],
  );

  //: An emptied scope falls back to the whole bibliography.
  const section = sections.find((s) => s.name === scope.category) ?? null;
  const group = section?.groups.find((g) => g.name === scope.sub) ?? null;
  const category = section === null ? null : section.name;
  const sub = group === null ? null : group.name;

  const shown = useMemo(() => {
    if (section === null) return sections;
    if (group === null) return [section];
    return [{ ...section, groups: [group] }];
  }, [sections, section, group]);

  const pick = useCallback((next: Scope) => {
    setScope(next);
  }, []);

  const body = (): React.ReactElement => {
    if (error !== null) {
      return (
        <p className={styles.state} role="alert">
          The bibliography could not be loaded. Run <code>npm run references</code> to
          regenerate it from the source library.
        </p>
      );
    }
    if (payload === null) return <p className={styles.state}>Loading&hellip;</p>;
    if (shown.length === 0) return <p className={styles.state}>No works match.</p>;
    return (
      <div className={styles.body}>
        {shown.map((s) => (
          <div className={styles.block} key={s.name}>
            {/* The category is named here only when the head above does not
                already name it - that is, only when everything is showing. */}
            {category === null ? <h2 className={styles.categoryHead}>{s.name}</h2> : null}
            {s.groups.map((g) => (
              <div className={styles.run} key={g.name ?? " ungrouped"}>
                {g.name === null ? null : <h3 className={styles.subHead}>{g.name}</h3>}
                <ul className={styles.entries}>
                  {g.entries.map((reference) => (
                    <Entry key={reference.id} reference={reference} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
        <p className={styles.colophon}>
          <a href={REFERENCES_BIB_URL} download>
            Export BibTeX
          </a>
        </p>
      </div>
    );
  };

  return (
    <>
      <PageHeader current="references" {...(navigate === undefined ? {} : { navigate })} />
      <main className={layout.page}>
        <div className={styles.layout}>
          <nav
            className={`${layout.panel} ${styles.selector}`}
            aria-label="Bibliography contents"
          >
            <button
              type="button"
              className={`${styles.scopeAll}${category === null ? ` ${styles.isOn}` : ""}`}
              onClick={() => {
                pick(ALL);
              }}
            >
              All
              <span className={styles.count}>{countWorks(sections)}</span>
            </button>
            {sections.map((s) => (
              <div className={styles.group} key={s.name}>
                <button
                  type="button"
                  className={`${styles.category}${category === s.name && sub === null ? ` ${styles.isOn}` : ""}`}
                  onClick={() => {
                    pick({ category: s.name, sub: null });
                  }}
                >
                  {s.name}
                  <span className={styles.count}>{totalIn(s)}</span>
                </button>
                {s.groups.map((g) =>
                  g.name === null ? null : (
                    <button
                      type="button"
                      key={g.name}
                      className={`${styles.sub}${category === s.name && sub === g.name ? ` ${styles.isOn}` : ""}`}
                      onClick={() => {
                        pick({ category: s.name, sub: g.name });
                      }}
                    >
                      {g.name}
                      <span className={styles.count}>{g.entries.length}</span>
                    </button>
                  ),
                )}
              </div>
            ))}
          </nav>

          <section className={layout.panel} aria-label="References">
            <div className={styles.head}>
              <span className={styles.subject}>
                <span className={styles.subjectName}>References</span>
                {category === null ? null : (
                  <span className={styles.subjectState}>{category}</span>
                )}
              </span>
              {payload === null ? null : (
                <div className={`${field.control} ${styles.filter}`}>
                  <label htmlFor="references-filter">Filter</label>
                  <input
                    id="references-filter"
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                    }}
                  />
                </div>
              )}
            </div>
            {body()}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
