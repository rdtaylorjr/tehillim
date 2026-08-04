import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths so the build works from any deployed subpath
  // (and directly from disk via file://) without extra server config.
  base: "./",
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
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
