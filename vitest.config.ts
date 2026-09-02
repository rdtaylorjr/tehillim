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
    setupFiles: ["./src/test/setup.ts", "./v1/test/setup.ts"],
    // Class names come back unscoped, so assertions read the stylesheet's own vocabulary.
    css: { modules: { classNameStrategy: "non-scoped" } },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}", "v1/**/*.{ts,tsx}", "shell/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "src/test/**",
        "v1/test/**",
        "src/main.tsx",
        // The d3 and canvas plots. jsdom implements neither layout nor a canvas
        // context, so a test here could assert that a chart was constructed but
        // never that it drew anything right - the browser check is what covers
        // these. Their pure geometry lives in v1/lib and is fully covered there.
        "v1/viz/**",
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
