import { sentenceCase } from "../../../shared/lib/corpus";
import { resolveRegister } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";
import type { DomainData, GenreBaselineRow } from "../../../shared/lib/results";

/** The length-alone rows of the register in view, the reference every model's overall row is read against. */
export function lengthBaseline(data: DomainData, selection: Selection): GenreBaselineRow[] {
  if (selection.benchmark !== "genre" || selection.genre !== "all") return [];
  const register = resolveRegister(data.genre_registers, selection);
  if (register === null) return [];
  return data.genre_baseline.filter(
    (r) => r.taxonomy === register.taxonomy && r.unit === register.unit,
  );
}

/** One line per predictor: what length alone scores, with the prevalence AP is read against. */
export function baselineLine(row: GenreBaselineRow): string {
  const auc = row.separation_auc.toFixed(4);
  const ap = row.average_precision.toFixed(4);
  const prevalence = row.prevalence.toFixed(4);
  return `Length alone, ${sentenceCase(row.predictor).toLowerCase()}: AUC ${auc}, AP ${ap} at prevalence ${prevalence}`;
}
