import { readFileSync } from "node:fs";

const pkg: { version: string } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

/** Build-time constants shared by the app build and the test run, defined once. */
export const define = { __APP_VERSION__: JSON.stringify(pkg.version) };

/** CSS Modules scope every class; camelCase keys keep the call sites readable. */
export const css = { modules: { localsConvention: "camelCaseOnly" } } as const;
