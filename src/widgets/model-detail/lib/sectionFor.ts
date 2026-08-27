import type { Selection } from "../../../shared/lib/selection";
import type { DetailSection } from "./dataPath";

/** The section the toolbar already determined, so the detail view never asks the reader again. */
export function sectionFor(selection: Selection): DetailSection {
  if (selection.benchmark === "parallelism") return "parallelism";
  return selection.metric === "genre" ? "genre" : "trajectory";
}
