/** One work, as `scripts/zotero-references.mjs` writes it out of Zotero. */
export interface Reference {
  /** Zotero's item key, stable across edits and across collections. */
  readonly id: string;
  /** Zotero's name for the item type, as its item pane shows it. */
  readonly type: string;
  readonly title: string;
  /** Italic for a standalone work, quoted for one inside a container. */
  readonly titleStyle: "italic" | "quoted";
  /** "In " before a container the work is a part of, empty otherwise. */
  readonly containerPrefix: string;
  /** Already formatted: "Lastname, First, and Second Author". */
  readonly creators: string;
  /** Free text as Zotero holds it, shown only where a year is absent. */
  readonly date: string;
  /** Null where no four-digit year could be read out of `date`. */
  readonly year: number | null;
  /** Journal, book, proceedings or publisher, whichever this type carries. */
  readonly container: string;
  /** Place, volume, issue and pages, already punctuated: "5.2: 126-135". */
  readonly detail: string;
  /** A DOI where the work has one, and its plain URL otherwise. */
  readonly url: string;
}

/** A run of works under one heading, `name` null where the section names it. */
export interface ReferenceGroup {
  readonly name: string | null;
  readonly entries: readonly Reference[];
}

/** One top-level Zotero collection, flattened to groups, empty ones dropped. */
export interface ReferenceSection {
  readonly name: string;
  readonly groups: readonly ReferenceGroup[];
}

export interface ReferencesPayload {
  /** The Zotero collection this was generated from. */
  readonly collection: string;
  /** Distinct works, fewer than the sections sum to, since an item may be filed twice. */
  readonly count: number;
  readonly sections: readonly ReferenceSection[];
}
