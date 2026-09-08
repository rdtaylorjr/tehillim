import type { DomainData } from "./domainData";

/** A row is only ever consulted for the model it names. */
interface NamedRow {
  readonly model?: string;
}

/** Whether a family's payload names a model anywhere, for a URL that omits the family. */
export function listsModel(data: DomainData, model: string): boolean {
  return Object.values(data).some((rows: readonly NamedRow[]) =>
    rows.some((row) => row.model === model),
  );
}
