import type { GenreAlignment } from "../../../shared/model";
import type { ParallelismOverallRow } from "../../../shared/lib/results";

/** Built by `npm run home-figures`, version-stamped so a stale copy cannot persist. */
export const HOME_FIGURES_URL = `${import.meta.env.BASE_URL}data/home_figures.json?v=${__APP_VERSION__}`;

export interface HomeFigures {
  readonly benchmark: { readonly rows: readonly ParallelismOverallRow[] };
  readonly compare: {
    readonly psalms: readonly number[];
    /** The 150x150 matrix for the compare page's default method. */
    readonly matrix: readonly (readonly number[])[];
    /** The 95th-percentile domain the compare page's scale uses. */
    readonly domainMax: number;
  };
  readonly cluster: { readonly alignment: GenreAlignment };
}

export async function loadHomeFigures(
  url: string = HOME_FIGURES_URL,
  fetcher: typeof fetch = fetch,
): Promise<HomeFigures> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Failed to load home figures: ${String(response.status)}`);
  }
  return (await response.json()) as HomeFigures;
}
