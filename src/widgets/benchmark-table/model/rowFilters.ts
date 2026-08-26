import { facetFor, facetOf } from "../../../shared/lib/catalog";
import type { FamilyId } from "../../../shared/lib/catalog";

export interface FacetableRow {
  model?: string;
  model_base?: string;
}

/** Rows whose model falls in the domain's chosen facet bucket; passthrough for "all" or a facet-less domain. */
export function applyFacetFilter<T extends FacetableRow>(
  rows: readonly T[],
  family: FamilyId,
  unit: string,
): T[] {
  if (unit === "all") return [...rows];
  const facet = facetFor(family);
  if (!facet) return [...rows];
  return rows.filter((r) => facetOf(r.model_base ?? r.model ?? "", facet.values) === unit);
}

export interface TextVariantRow {
  text_variant?: string;
}

/** Rows matching the chosen text variant; passthrough for "all". */
export function applyTextFilter<T extends TextVariantRow>(
  rows: readonly T[],
  text: string,
): T[] {
  if (text === "all") return [...rows];
  return rows.filter((r) => r.text_variant === text);
}

export interface NamedRow {
  model?: string;
}

/** Rows whose model name contains the filter text, case-insensitively; passthrough when the filter is empty. */
export function applyNameFilter<T extends NamedRow>(rows: readonly T[], filter: string): T[] {
  if (!filter) return [...rows];
  const needle = filter.toLowerCase();
  return rows.filter((r) => (r.model ?? "").toLowerCase().includes(needle));
}
