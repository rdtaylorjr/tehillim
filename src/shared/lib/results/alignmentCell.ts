import type { ReferenceColorMode } from "../../../shared/lib/color";
import type { ClusterMethodPayload, GenreAlignment, GunkelPayload } from "../../model";

/** Above this share the cell is dark enough that the text switches to white. */
export const DARK_CELL_THRESHOLD = 0.55;

/** The fraction of a category's psalms in one cluster, zero for an empty category. */
export function computeShare(count: number, total: number): number {
  return total > 0 ? count / total : 0;
}

/** Whether a cell's shade is dark enough that its count needs light text. */
export function isDarkCell(share: number): boolean {
  return share > DARK_CELL_THRESHOLD;
}

/** The cell the selected psalm falls into, so it can be highlighted. */
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

/** Which cross-tab to show, matching the picker's granularity, "book" falling back to genres. */
export function alignmentFor(
  method: ClusterMethodPayload,
  mode: ReferenceColorMode,
): GenreAlignment {
  return mode === "family" ? method.familyAlignment : method.genreAlignment;
}

/** Where the selected psalm sits in the shown table, null where either side is unknown. */
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
