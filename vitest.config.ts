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
    setupFiles: ["./src/test/setup.ts"],
    // Class names come back unscoped, so assertions read the stylesheet's own vocabulary.
    css: { modules: { classNameStrategy: "non-scoped" } },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
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
