import { EMPTY_DOMAIN_DATA } from "../lib/results";
import type { DomainData, LoadedSlice } from "../lib/results";
import { familyFor } from "../lib/corpus";
import type { FamilyId } from "../lib/corpus";

export type Fetcher = (input: string) => Promise<Response>;

/** Results arrived, the family was never benchmarked, or they could not be reached. */
export type DomainLoad =
  | { readonly status: "loaded"; readonly data: DomainData }
  | { readonly status: "absent" }
  | { readonly status: "failed" };

/** Where the exported results are served from, relative to whatever base the site is deployed under. */
export const dataUrl = (family: FamilyId): string =>
  `${import.meta.env.BASE_URL}data/ui_${family}.json`;

/** The rows of one sliced table, fetched when the view that reads them opens. */
export const sliceUrl = (family: FamilyId, name: string): string =>
  `${import.meta.env.BASE_URL}data/ui_${family}_${name}.json`;

/** One slice's rows, or none where the export holds no such slice. */
export async function loadSlice(
  family: FamilyId,
  table: LoadedSlice["table"],
  name: string,
  fetcher: Fetcher = fetch,
): Promise<LoadedSlice["rows"]> {
  try {
    const response = await fetcher(sliceUrl(family, name));
    if (!response.ok) return [];
    const payload = (await response.json()) as Record<string, Partial<DomainData> | undefined>;
    return payload[family]?.[table] ?? [];
  } catch {
    return [];
  }
}

/** One family's results, or the reason there are none. */
export async function loadDomainData(
  family: FamilyId,
  fetcher: Fetcher = fetch,
): Promise<DomainLoad> {
  //: A host's answer to a missing file cannot distinguish absent from unreachable.
  if (!familyFor(family).hasData) return { status: "absent" };

  let response: Response;
  try {
    response = await fetcher(dataUrl(family));
  } catch {
    return { status: "failed" };
  }

  if (response.status === 404) return { status: "absent" };
  if (!response.ok) return { status: "failed" };

  try {
    const payload = (await response.json()) as Record<string, Partial<DomainData> | undefined>;
    const section = payload[family];
    //: An absent key means absent data, whatever an unrelated payload would parse as.
    if (section === undefined) return { status: "absent" };
    return { status: "loaded", data: { ...EMPTY_DOMAIN_DATA, ...section } };
  } catch {
    return { status: "failed" };
  }
}
