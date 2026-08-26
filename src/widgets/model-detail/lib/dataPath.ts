/** Stopgap fetch path convention for a model's sample detail JSON, pending the real per-model export pipeline. */
export function detailDataPath(domain: string, model: string): string {
  return `./sample-data/detail_${domain}_${model}.json`;
}
