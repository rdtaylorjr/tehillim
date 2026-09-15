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

function copy(from, to) {
  const source = join(DATA_ROOT, from);
  if (!existsSync(source)) {
    return { to, ok: false, reason: `missing ${source}` };
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(source, to);
  return { to, ok: true };
}

/** The benchmark and compare payloads, which their own drivers write into this checkout. */
function reportDriverPayloads() {
  const present = existsSync("public/data")
    ? readdirSync("public/data").filter((n) => n.startsWith("ui_") || n === "compare.json")
        .length
    : 0;
  console.log(
    `  public/data holds ${present} benchmark and compare payloads ` +
      "(written by tehillim-benchmark and tehillim-compare, not by this script)",
  );
}

const results = PUBLIC_PAYLOADS.map(([from, to]) => copy(from, to));
for (const r of results) {
  console.log(r.ok ? `  copied ${r.to}` : `  SKIPPED ${r.to}: ${r.reason}`);
}
reportDriverPayloads();

const missing = results.filter((r) => !r.ok);
if (missing.length > 0) {
  console.error(
    `\n${missing.length} payload(s) missing. Run tehillim-cluster ` +
      `against ${DATA_ROOT}, then rerun this script.`,
  );
  process.exit(1);
}
