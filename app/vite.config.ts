import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const { version: appVersion } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as {
  version: string;
};

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  // Root-absolute asset paths, not relative ones: this is now a real SPA
  // with a virtual client-side route (/cluster/) that has no physical
  // index.html of its own - the host's SPA fallback (see wrangler.jsonc's
  // not_found_handling) serves the *same* built index.html byte-for-byte
  // at that path. Relative asset URLs in that file would then resolve
  // against /cluster/ (e.g. /cluster/assets/main.js, which doesn't exist)
  // instead of the real /assets/main.js. The tradeoff: unlike the old
  // two-physical-page build, the built output can no longer be opened
  // directly via a file:// URL - use `npm run preview` (or `npm run dev`)
  // to check a build locally.
  base: "/",
  build: {
    // This app is the site: ship the build straight to the repo root so
    // the domain root serves it directly, no redirect or subpath. The old
    // marketing page now lives at repo-root/about/, untouched by this build.
    outDir: "..",
    // Deliberately NOT emptyOutDir: true - outDir is the repo root, and
    // emptying it would delete about/, pipeline/, README.md, .git, etc.
    // Stale hashed asset files from prior builds may accumulate under
    // repo-root/assets/; safe to prune by hand occasionally.
    emptyOutDir: false,
    // A single entry now that Compare and Cluster are one SPA (see
    // src/main.ts) rather than two physically separate pages - Vite's
    // default of building whichever index.html sits at the project root
    // is exactly right, no rollupOptions.input override needed.
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
