import type { ReferenceColorMode } from "./referenceColor";
import type { ClusterMethodPayload, GenreAlignment, GunkelPayload } from "../types";

/** Cell shares above this read as dark enough that dark ink text loses
 * contrast against them - switch to white past this point. */
export const DARK_CELL_THRESHOLD = 0.55;

/** What fraction of a category's psalms landed in one cluster. 0 for an
 * empty category rather than NaN, since an empty row still needs to
 * render (as entirely pale cells). */
export function computeShare(count: number, total: number): number {
  return total > 0 ? count / total : 0;
}

/** Whether a cell's shade is dark enough that its count needs light text. */
export function isDarkCell(share: number): boolean {
  return share > DARK_CELL_THRESHOLD;
}

/** Identifies the table cell (row category + column cluster) that the
 * currently-selected psalm falls into, so it can be highlighted. */
export interface SelectedAlignmentCell {
  category: string;
  cluster: number;
}

export function isSelectedCell(
  genre: string,
  clusterIndex: number,
  selected: SelectedAlignmentCell | null,
): boolean {
  return selected !== null && genre === selected.category && clusterIndex === selected.cluster;
}

/** Which of a cluster method's two alignment cross-tabs to show, matching
 * the granularity of the shared Books/Gunkel picker dropdown. "book" has
 * no Gunkel granularity of its own, so it falls back to the finer,
 * 14-genre table (the original, pre-family-alignment default). */
export function alignmentFor(method: ClusterMethodPayload, mode: ReferenceColorMode): GenreAlignment {
  return mode === "family" ? method.familyAlignment : method.genreAlignment;
}

/** Where the selected psalm sits in the alignment table currently shown -
 * its Gunkel category (matching alignmentFor's granularity) crossed with
 * the cluster this signal actually placed it in. Null whenever either
 * side is unknown (no psalm selected, or the psalm is one of the
 * excluded composite/partial psalms with no primary Gunkel category). */
export function selectedAlignmentCell(
  gunkel: GunkelPayload,
  method: ClusterMethodPayload,
  mode: ReferenceColorMode,
  selectedPsalm: number | null,
): SelectedAlignmentCell | null {
  if (selectedPsalm === null) return null;
  const entry = gunkel.psalms.find((p) => p.number === selectedPsalm);
  const category = mode === "family" ? entry?.family : entry?.genre;
  const cluster = method.assignments[String(selectedPsalm)];
  if (!category || cluster === undefined) return null;
  return { category, cluster };
}
