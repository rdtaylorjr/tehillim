import type { GenreRegister } from "../results";
import type { Selection } from "./selection";

/** The register a selection reads: the source's, at its chosen unit or its first, or null. */
export function resolveRegister(
  registers: readonly GenreRegister[],
  selection: Pick<Selection, "source" | "unit">,
): GenreRegister | null {
  const ofSource = registers.filter((r) => r.taxonomy === selection.source);
  return ofSource.find((r) => r.unit === selection.unit) ?? ofSource[0] ?? null;
}

/** The segment the export names a register's files by: the taxonomy, then its unit if any. */
export function registerKey(register: Pick<GenreRegister, "taxonomy" | "unit">): string {
  return register.unit === null ? register.taxonomy : `${register.taxonomy}_${register.unit}`;
}
