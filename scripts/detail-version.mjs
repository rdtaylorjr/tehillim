/** Stamps the detail export with a content hash, so a regenerated payload gets a new URL. */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "detail-data";
const STAMP = join(SOURCE, "VERSION");

/** Short enough to read in a URL, wide enough that a rebuild cannot collide in practice. */
const LENGTH = 12;

const names = readdirSync(SOURCE)
  .filter((name) => name.startsWith("detail_") && name.endsWith(".json"))
  .sort();
if (names.length === 0) {
  //: A checkout without the gitignored export still builds; the stamp stays at its default.
  console.log(`No detail payloads in ${SOURCE}/, leaving the version unstamped.`);
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

writeFileSync(STAMP, `${version}\n`);
console.log(`${version}  (${names.length} payloads)`);
