import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { css, define } from "./vite.shared";

export default defineConfig({
  plugins: [react()],
  define,
  css,
});
