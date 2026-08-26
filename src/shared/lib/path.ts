import { familyFor, sentenceCase } from "./catalog";
import { showsText } from "./selection";
import type { Selection } from "./selection";

/** Majors are the two crossed trees, minors the filters hanging off them, model the open row. */
export type CrumbKind = "major" | "minor" | "model";

export interface Crumb {
  readonly kind: CrumbKind;
  readonly label: string;
}

/** The selection stated as a path, with every filter left at its default omitted. */
export function selectionPath(selection: Selection): Crumb[] {
  const path: Crumb[] = [
    { kind: "major", label: familyFor(selection.family).label },
    { kind: "major", label: sentenceCase(selection.benchmark) },
  ];
  const minor = (label: string): void => {
    path.push({ kind: "minor", label });
  };

  if (selection.facet !== "all") minor(sentenceCase(selection.facet));
  if (showsText(selection.family, selection.facet) && selection.text !== "all") {
    minor(sentenceCase(selection.text));
  }
  if (selection.benchmark === "parallelism") {
    if (selection.parallelismType !== "all") minor(selection.parallelismType);
  } else if (selection.genre !== "all") {
    minor(selection.genre);
  }

  if (selection.model !== null) path.push({ kind: "model", label: selection.model });
  return path;
}

/** The same path as a sentence, for a caption or any other place prose reads better than crumbs. */
export function pathSentence(selection: Selection): string {
  const crumbs = selectionPath(selection);
  const majors = crumbs
    .filter((crumb) => crumb.kind === "major")
    .map((crumb) => crumb.label)
    .join(" \u00d7 ");
  const minors = crumbs.filter((crumb) => crumb.kind === "minor").map((crumb) => crumb.label);
  return minors.length > 0 ? `${majors}, filtered to ${minors.join(", ")}` : majors;
}
