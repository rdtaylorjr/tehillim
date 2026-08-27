import { createReadStream, existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { css, define } from "./vite.shared";
import { detailFileFor } from "./detailFile";

/** In production a Worker serves these from R2; locally they come from the gitignored export. */
function serveDetail(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const name = detailFileFor(req.url ?? "");
  if (name === null) {
    next();
    return;
  }
  const file = new URL(`./detail-data/${name}`, import.meta.url);
  if (!existsSync(file)) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  res.setHeader("content-type", "application/json");
  createReadStream(file).pipe(res);
}

/** Applied to preview as well as dev, so the production build can be checked against real payloads. */
function detailPayloads(): Plugin {
  return {
    name: "detail-payloads",
    configureServer: (server) => {
      server.middlewares.use(serveDetail);
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(serveDetail);
    },
  };
}

export default defineConfig({
  plugins: [react(), detailPayloads()],
  define,
  css,
});
