import type { Reference, ReferenceSection } from "../model/types";

/** Folds case and strips Latin diacritics, leaving Hebrew marks alone. */
export function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Everything about a work a reader might type. */
function haystack(reference: Reference): string {
  return fold(
    [
      reference.creators,
      reference.title,
      reference.container,
      reference.detail,
      reference.type,
      reference.year === null ? reference.date : String(reference.year),
    ].join(" "),
  );
}

/** Every term must appear somewhere in the entry, in any order. */
export function matches(reference: Reference, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const text = haystack(reference);
  return terms.every((term) => text.includes(term));
}

export function termsOf(query: string): string[] {
  return fold(query)
    .split(/\s+/)
    .filter((term) => term !== "");
}

/** The payload narrowed to what matches, empty groups and sections dropped. */
export function filterSections(
  sections: readonly ReferenceSection[],
  terms: readonly string[],
): readonly ReferenceSection[] {
  if (terms.length === 0) return sections;
  const narrowed: ReferenceSection[] = [];
  for (const section of sections) {
    const groups = section.groups
      .map((group) => ({ ...group, entries: group.entries.filter((e) => matches(e, terms)) }))
      .filter((group) => group.entries.length > 0);
    if (groups.length > 0) narrowed.push({ ...section, groups });
  }
  return narrowed;
}

/** A stable id for a collection or subcollection, for the index to link to. */
export function slug(...parts: readonly string[]): string {
  return (
    "ref-" +
    parts
      .map((part) =>
        fold(part)
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      )
      .filter((part) => part !== "")
      .join("--")
  );
}
