import { existsSync, readFileSync } from "node:fs";

const pkg: { version: string } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

/** Stamped by scripts/detail-version.mjs and committed, so every build agrees on the version. */
function detailVersion(): string {
  const stamp = new URL("./detail-version.json", import.meta.url);
  if (!existsSync(stamp)) return "dev";
  return (JSON.parse(readFileSync(stamp, "utf8")) as { version: string }).version;
}

/** Build-time constants shared by the app build and the test run, defined once. */
export const define = {
  __APP_VERSION__: JSON.stringify(pkg.version),
  __DETAIL_VERSION__: JSON.stringify(detailVersion()),
};

/** CSS Modules scope every class; camelCase keys keep the call sites readable. */
export const css = { modules: { localsConvention: "camelCaseOnly" } } as const;
