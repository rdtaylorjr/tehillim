import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths so the build works from any deployed subpath
  // (and directly from disk via file://) without extra server config.
  base: "./",
  build: {
    // Ship the built app as a sibling of the source project, at
    // repo-root/compare/, so the marketing site can link to a real static
    // page instead of the unbuildable Vite source entry (app/index.html).
    outDir: "../compare",
    emptyOutDir: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
