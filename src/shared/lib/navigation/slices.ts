import { registerKey, resolveRegister } from "./registers";
import type { Selection } from "./selection";
import type { GenreRegister } from "../results";

/** One table the export ships apart, and the file its rows for this selection sit in. */
export interface Slice {
  readonly table: "genre_by_genre";
  readonly name: string;
}

/** The slice a selection's table reads, or null while the core payload holds every row it needs. */
export function sliceFor(
  selection: Selection,
  registers: readonly GenreRegister[],
): Slice | null {
  if (selection.benchmark !== "genre" || selection.genre === "all") return null;
  const register = resolveRegister(registers, selection);
  return register === null
    ? null
    : { table: "genre_by_genre", name: `genre_${registerKey(register)}` };
}
