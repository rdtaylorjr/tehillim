import { detailDataPath } from "../lib/dataPath";
import type { DetailSection } from "../lib/dataPath";
import type { DetailData } from "../model/types";

export type DetailLoad =
  | { readonly status: "loaded"; readonly data: DetailData }
  | { readonly status: "absent" }
  | { readonly status: "failed" };

export type DetailLoader = (
  domain: string,
  model: string,
  section: DetailSection,
) => Promise<DetailLoad>;

/** Caches by URL, since a model's export never changes, and drops failures so they retry. */
export function createDetailLoader(fetcher: typeof fetch = fetch): DetailLoader {
  const cache = new Map<string, Promise<DetailLoad>>();

  return (domain, model, section) => {
    const url = detailDataPath(domain, model, section);
    const hit = cache.get(url);
    if (hit !== undefined) return hit;

    const pending = fetcher(url)
      .then(async (response): Promise<DetailLoad> => {
        if (response.status === 404) return { status: "absent" };
        if (!response.ok) return { status: "failed" };
        return { status: "loaded", data: (await response.json()) as DetailData };
      })
      .catch((): DetailLoad => ({ status: "failed" }));

    cache.set(url, pending);
    void pending.then((result) => {
      if (result.status === "failed") cache.delete(url);
    });
    return pending;
  };
}
