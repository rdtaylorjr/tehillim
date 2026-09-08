/** Stamps the detail export with a content hash, so a regenerated payload gets a new URL. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "detail-data";

/** Tracked, unlike the export itself: a CI build has no payloads to hash but must still stamp. */
const STAMP = "detail-version.json";

/** Short enough to read in a URL, wide enough that a rebuild cannot collide in practice. */
const LENGTH = 12;

//: The export is gitignored, so a clean checkout has no directory at all, not an empty one.
const names = existsSync(SOURCE)
  ? readdirSync(SOURCE)
      .filter((name) => name.startsWith("detail_") && name.endsWith(".json"))
      .sort()
  : [];

if (names.length === 0) {
  //: Without payloads there is nothing to hash, so the committed stamp stands unchanged.
  const current = existsSync(STAMP) ? JSON.parse(readFileSync(STAMP, "utf8")).version : "none";
  console.log(`No payloads in ${SOURCE}/, keeping the committed stamp (${current}).`);
  process.exit(0);
}

//: Hashing each payload's own digest, so the stamp changes when any content does.
const digest = createHash("sha256");
for (const name of names) {
  digest.update(name);
  digest.update(
    createHash("sha256")
      .update(readFileSync(join(SOURCE, name)))
      .digest(),
  );
}
const version = digest.digest("hex").slice(0, LENGTH);

const previous = existsSync(STAMP) ? JSON.parse(readFileSync(STAMP, "utf8")).version : null;
writeFileSync(STAMP, `${JSON.stringify({ version, payloads: names.length }, null, 2)}\n`);
console.log(
  previous === version
    ? `${version}  (${names.length} payloads, unchanged)`
    : `${version}  (${names.length} payloads, was ${previous ?? "unstamped"} \u2014 commit ${STAMP})`,
);
