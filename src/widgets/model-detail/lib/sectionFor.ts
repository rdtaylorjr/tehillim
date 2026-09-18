import { registerKey, resolveRegister } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";
import type { GenreRegister } from "../../../shared/lib/results";
import type { DetailSection } from "./dataPath";

/** The section the toolbar already determined, or null while no register answers the selection. */
export function sectionFor(
  selection: Selection,
  registers: readonly GenreRegister[],
): DetailSection | null {
  if (selection.benchmark === "parallelism") return "parallelism";
  const register = resolveRegister(registers, selection);
  return register === null ? null : `genre_${registerKey(register)}`;
}
