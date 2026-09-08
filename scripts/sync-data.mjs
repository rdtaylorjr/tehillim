/** Copies the published analyses out of tehillim-data into the directories this app serves. */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

/** Where the analyses are published, overridable for a checkout kept somewhere else. */
const DATA_ROOT = process.env.TEHILLIM_DATA_DIR ?? "../tehillim-data";

/** Served as-is from public/data, so the browser fetches them by these names. */
const PUBLIC_PAYLOADS = [
  ["analysis=cluster/stage=ui/clustering.json", "public/data/clustering.json"],
  //: Read by both the compare and cluster pages, so it is published outside either.
  ["reference/stage=ui/gunkel.json", "public/data/gunkel.json"],
];

/** Streamed by the dev server from detail-data rather than bundled, being large. */
const DETAIL_PAYLOADS = [
  ["analysis=compare/stage=ui/similarity.json", "detail-data/detail_similarity.json"],
];

function copy(from, to) {
  const source = join(DATA_ROOT, from);
  if (!existsSync(source)) {
    return { to, ok: false, reason: `missing ${source}` };
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(source, to);
  return { to, ok: true };
}

/** The per-domain benchmark payloads, which tehillim-benchmark's ui_export writes. */
function reportBenchmarkPayloads() {
  const present = existsSync("public/data")
    ? readdirSync("public/data").filter((n) => n.startsWith("ui_")).length
    : 0;
  console.log(
    `  public/data holds ${present} ui_*.json benchmark payloads ` +
      "(written by tehillim-benchmark's ui_export, not by this script)",
  );
}

const results = [...PUBLIC_PAYLOADS, ...DETAIL_PAYLOADS].map(([from, to]) => copy(from, to));
for (const r of results) {
  console.log(r.ok ? `  copied ${r.to}` : `  SKIPPED ${r.to}: ${r.reason}`);
}
reportBenchmarkPayloads();

const missing = results.filter((r) => !r.ok);
if (missing.length > 0) {
  console.error(
    `\n${missing.length} payload(s) missing. Run tehillim-compare then tehillim-cluster ` +
      `against ${DATA_ROOT}, then rerun this script.`,
  );
  process.exit(1);
}
