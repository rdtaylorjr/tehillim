export interface Env {
  readonly DETAIL: R2Bucket;
  readonly ASSETS: Fetcher;
}

/** Detail payloads live in R2; everything else is a static asset shipped with the build. */
const DETAIL_PREFIX = "/data/detail_";

/** A model's export never changes in place, so the edge may hold it indefinitely. */
const IMMUTABLE = "public, max-age=31536000, immutable";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith(DETAIL_PREFIX)) return env.ASSETS.fetch(request);

    const object = await env.DETAIL.get(pathname.slice("/data/".length));
    if (object === null) return new Response("Not found", { status: 404 });
    return new Response(object.body, {
      headers: { "content-type": "application/json", "cache-control": IMMUTABLE },
    });
  },
} satisfies ExportedHandler<Env>;
