/** The section the toolbar already chose, so a click never downloads the sections it will not draw. */
export type DetailSection = "parallelism" | "genre" | "trajectory";

/** Where one model's detail payload for one section is served from. */
export function detailDataPath(domain: string, model: string, section: DetailSection): string {
  return `${import.meta.env.BASE_URL}data/detail_${domain}_${model}_${section}.json`;
}
