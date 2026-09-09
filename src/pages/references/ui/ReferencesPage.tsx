import { useCallback, useEffect, useMemo, useState } from "react";
import layout from "../../../shared/ui/panel.module.css";
import field from "../../../shared/ui/Field.module.css";
import styles from "./ReferencesPage.module.css";
import { PageHeader } from "../../../widgets/layout";
import { Footer } from "../../../widgets/footer";
import { REFERENCES_BIB_URL, loadReferences } from "../api/loadReferences";
import { filterSections, termsOf } from "../lib/filter";
import type { Reference, ReferenceSection, ReferencesPayload } from "../model/types";
import type { NavigateHandler } from "../../../../shell/Root";

/** Every work here is published elsewhere, so each link leaves the app. */
const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

/** What the reader asked to see, resolved against whatever the payload turns out to hold. */
interface Scope {
  readonly category: string | null;
  readonly sub: string | null;
}

/** One run of citations, carrying the path that names it while a filter is running. */
interface Run {
  readonly path: string;
  readonly entries: readonly Reference[];
}

/** Every matching run across the whole bibliography, each headed by its category path. */
function runsOf(sections: readonly ReferenceSection[]): Run[] {
  return sections.flatMap((section) =>
    section.groups.map((group) => ({
      path: group.name === null ? section.name : `${section.name} / ${group.name}`,
      entries: group.entries,
    })),
  );
}

/** One citation in author-date form, every string composed by the generator. */
function Entry({ reference }: { readonly reference: Reference }): React.ReactElement {
  const titled =
    reference.titleStyle === "italic" ? (
      <span className={styles.workTitle}>{reference.title}</span>
    ) : (
      <>&ldquo;{reference.title}.&rdquo;</>
    );
  const citation = (
    <>
      {reference.creators === "" ? null : `${reference.creators} `}
      <span className={styles.year}>{reference.year ?? reference.date}. </span>
      {titled}
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
    </>
  );
  return (
    <li className={styles.entry}>
      {reference.url === "" ? (
        citation
      ) : (
        <a className={styles.citationLink} href={reference.url} {...EXTERNAL}>
          {citation}
        </a>
      )}
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
  const [scope, setScope] = useState<Scope>({ category: null, sub: null });

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
  const all = useMemo(() => payload?.sections ?? [], [payload]);
  const matched = useMemo(() => filterSections(all, terms), [all, terms]);
  //: A filter matching nothing leaves the whole list standing, rather than an empty selector.
  const sections = matched.length === 0 ? all : matched;

  //: Nothing chosen, or a choice the payload does not hold, opens on the first category.
  //: Resolved against the whole bibliography, so a filter never moves the chosen scope.
  const section = all.find((s) => s.name === scope.category) ?? all[0] ?? null;
  const group = section?.groups.find((g) => g.name === scope.sub) ?? null;
  const category = section === null ? null : section.name;
  const sub = group === null ? null : group.name;

  //: A filter searches the whole bibliography, so its results ignore the chosen scope.
  const filtering = terms.length > 0;
  const runs = useMemo(() => (filtering ? runsOf(matched) : []), [filtering, matched]);
  const shown = useMemo(() => {
    if (section === null) return [];
    if (group === null) return [section];
    return [{ ...section, groups: [group] }];
  }, [section, group]);

  //: The selector and the filter are two ways to the same panel, so choosing one drops the other.
  const pick = useCallback((next: Scope) => {
    setScope(next);
    setQuery("");
  }, []);

  //: A filter ignores the chosen scope, so the selector shows nothing chosen while one runs.
  const marked = (name: string, run: string | null): boolean =>
    !filtering && category === name && sub === run;

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
    if ((filtering ? runs : shown).length === 0) {
      return <p className={styles.state}>No works match.</p>;
    }
    return (
      <div className={styles.body}>
        {filtering
          ? runs.map((r) => (
              <div className={styles.block} key={r.path}>
                <h2 className={styles.runHead}>{r.path}</h2>
                <ul className={styles.entries}>
                  {r.entries.map((reference) => (
                    <Entry key={reference.id} reference={reference} />
                  ))}
                </ul>
              </div>
            ))
          : shown.map((s) => (
              <div className={styles.block} key={s.name}>
                {s.groups.map((g) => (
                  <div className={styles.run} key={g.name ?? " ungrouped"}>
                    {g.name === null ? null : <h3 className={styles.runHead}>{g.name}</h3>}
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
            {sections.map((s) => (
              <div className={styles.group} key={s.name}>
                <button
                  type="button"
                  className={`${styles.category}${marked(s.name, null) ? ` ${styles.isOn}` : ""}`}
                  {...(marked(s.name, null) ? { "aria-current": true as const } : {})}
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
                      className={`${styles.sub}${marked(s.name, g.name) ? ` ${styles.isOn}` : ""}`}
                      {...(marked(s.name, g.name) ? { "aria-current": true as const } : {})}
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
                {category === null || filtering ? null : (
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
