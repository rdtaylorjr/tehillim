/** The section the toolbar already chose, so a click never downloads the sections it will not draw. */
export type DetailSection = "parallelism" | "genre" | "trajectory";

/** Where one model's detail payload for one section is served from.
 *  The version rides in the query: the Worker keys R2 on the path alone, while caches
 *  key on the whole URL, so a regenerated export is fetched fresh without being re-uploaded. */
export function detailDataPath(domain: string, model: string, section: DetailSection): string {
  const name = `detail_${domain}_${model}_${section}.json`;
  return `${import.meta.env.BASE_URL}data/${name}?v=${__DETAIL_VERSION__}`;
}
