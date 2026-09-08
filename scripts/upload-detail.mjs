/** Uploads the detail payloads to the R2 bucket the Worker serves them from. */
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** The Worker strips "/data/" before the lookup, so a key is the bare filename. */
const SOURCE = "detail-data";
const BUCKET = "tehillim";

/** Uploaded one at a time, so a failure names the payload that caused it. */
function put(name) {
  execFileSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${BUCKET}/${name}`,
      "--file",
      join(SOURCE, name),
      "--content-type",
      "application/json",
      "--remote",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
}

const names = readdirSync(SOURCE).filter((n) => n.startsWith("detail_") && n.endsWith(".json"));
if (names.length === 0) {
  console.error(`No detail payloads in ${SOURCE}/. Rebuild them before uploading.`);
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const bytes = names.reduce((sum, n) => sum + statSync(join(SOURCE, n)).size, 0);
console.log(
  `${dryRun ? "Would upload" : "Uploading"} ${names.length} payloads ` +
    `(${(bytes / 1024 / 1024).toFixed(0)} MiB) to r2://${BUCKET}`,
);
if (dryRun) process.exit(0);

let done = 0;
for (const name of names) {
  try {
    put(name);
  } catch (error) {
    console.error(`\nFailed on ${name}: ${error.stderr?.toString().trim() ?? error.message}`);
    process.exit(1);
  }
  done += 1;
  if (done % 25 === 0 || done === names.length) {
    process.stdout.write(`\r  ${done}/${names.length}`);
  }
}
console.log("\nDone.");
