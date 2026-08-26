import { EMPTY_DOMAIN_DATA } from "../lib/results";
import type { DomainData } from "../lib/results";
import { familyFor } from "../lib/catalog";
import type { FamilyId } from "../lib/catalog";

export type Fetcher = (input: string) => Promise<Response>;

/**
 * Three outcomes a reader must be able to tell apart: results arrived, this family was never
 * benchmarked, or the results exist but could not be reached. Collapsing the last two into an
 * empty table would assert an absence of evidence that the data does not support.
 */
export type DomainLoad =
  | { readonly status: "loaded"; readonly data: DomainData }
  | { readonly status: "absent" }
  | { readonly status: "failed" };

/** Where the exported results are served from, relative to whatever base the site is deployed under. */
export const dataUrl = (family: FamilyId): string =>
  `${import.meta.env.BASE_URL}data/ui_${family}.json`;

/**
 * The per-genre trajectory rows for one metric. They are four fifths of a family's results and
 * only one view reads them, so they are fetched when that view is opened rather than up front.
 */
export const trajectorySliceUrl = (family: FamilyId, metric: string): string =>
  `${import.meta.env.BASE_URL}data/ui_${family}_trajectory_${metric}.json`;

/** One metric's per-genre trajectory rows, or none where the export holds no such slice. */
export async function loadTrajectorySlice(
  family: FamilyId,
  metric: string,
  fetcher: Fetcher = fetch,
): Promise<DomainData["trajectory_by_genre"]> {
  try {
    const response = await fetcher(trajectorySliceUrl(family, metric));
    if (!response.ok) return [];
    const payload = (await response.json()) as Record<string, Partial<DomainData> | undefined>;
    return payload[family]?.trajectory_by_genre ?? [];
  } catch {
    return [];
  }
}

/** One family's results, or the reason there are none. */
export async function loadDomainData(
  family: FamilyId,
  fetcher: Fetcher = fetch,
): Promise<DomainLoad> {
  // A family with no benchmark run has no export to ask for, and a host's answer to a missing
  // file cannot be trusted to distinguish the two: many reply 200 with their own HTML shell.
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
    // A host that answers a missing file with its own HTML shell parses as JSON in no case,
    // but one that answers with an unrelated payload would; an absent key means absent data.
    if (section === undefined) return { status: "absent" };
    return { status: "loaded", data: { ...EMPTY_DOMAIN_DATA, ...section } };
  } catch {
    return { status: "failed" };
  }
}
