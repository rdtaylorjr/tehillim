import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { css, define } from "./vite.shared";

export default defineConfig({
  plugins: [react()],
  define,
  css,
  test: {
    globals: true,
    environment: "jsdom",
    // The toolbar permutation tests run 2s alone and several times that when 64 files compete for cores.
    testTimeout: 20000,
    setupFiles: ["./src/test/setup.ts", "./src/test/psalm-picker-setup.ts"],
    // Class names come back unscoped, so assertions read the stylesheet's own vocabulary.
    css: { modules: { classNameStrategy: "non-scoped" } },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}", "shell/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        // The d3 and canvas plots. jsdom implements neither layout nor a canvas
        // context, so a test here could assert that a chart was constructed but
        // never that it drew anything right - the browser check is what covers
        // these. Their pure geometry lives in the page lib folders and is fully covered there.
        "src/pages/*/charts/**",
        // Composition only: which page a path resolves to is covered by
        // shell/route.test.ts, and both branches are lazy imports.
        "shell/Root.tsx",
        // Declarations emit no code, generated ones least of all.
        "src/**/*.d.ts",
        // Types only: nothing is emitted, so there is nothing to execute.
        "src/shared/lib/results/tableColumn.ts",
        "src/shared/lib/results/resultRows.ts",
      ],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
