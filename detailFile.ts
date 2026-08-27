/** Detail payloads live in R2 in production; this names the local file standing in for one. */
const PREFIX = "/data/detail_";

/** The file a detail request maps to, or null when the request is not for one. */
export function detailFileFor(url: string): string | null {
  const path = url.split("?")[0] ?? "";
  if (!path.startsWith(PREFIX)) return null;
  const name = path.slice("/data/".length);
  // A payload name is one flat segment, so anything with a separator is refused rather than served.
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return null;
  return name;
}
