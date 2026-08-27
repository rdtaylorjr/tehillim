import { describe, expect, it, vi } from "vitest";
import worker from "./index";
import type { Env } from "./index";

/** Stands in for the R2 bucket and the static-asset binding the platform provides. */
function env(stored: Record<string, string> = {}): Env {
  return {
    DETAIL: {
      get: (key: string) =>
        Promise.resolve(
          key in stored ? { body: stored[key] as unknown as ReadableStream } : null,
        ),
    },
    ASSETS: { fetch: vi.fn(() => Promise.resolve(new Response("asset"))) },
  } as unknown as Env;
}

const get = (path: string): Request => new Request(`https://tehillim.dev${path}`);

describe("detail requests", () => {
  it("serves a stored payload from the bucket", async () => {
    const res = await worker.fetch(
      get("/data/detail_semantic_berel_genre.json"),
      env({
        "detail_semantic_berel_genre.json": "{}",
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
  });

  it("marks a payload immutable, since a model's export never changes in place", async () => {
    const res = await worker.fetch(
      get("/data/detail_semantic_berel_genre.json"),
      env({
        "detail_semantic_berel_genre.json": "{}",
      }),
    );
    expect(res.headers.get("cache-control")).toContain("immutable");
  });

  it("404s a payload the bucket does not hold, rather than falling through to the app shell", async () => {
    const res = await worker.fetch(get("/data/detail_semantic_absent_genre.json"), env());
    expect(res.status).toBe(404);
  });
});

describe("everything else", () => {
  it("hands non-detail paths to the static assets", async () => {
    const e = env();
    const res = await worker.fetch(get("/data/ui_semantic.json"), e);
    expect(await res.text()).toBe("asset");
    expect(e.ASSETS.fetch).toHaveBeenCalledOnce();
  });

  it("hands page routes to the static assets", async () => {
    const e = env();
    await worker.fetch(get("/"), e);
    expect(e.ASSETS.fetch).toHaveBeenCalledOnce();
  });

  it("never reads the bucket for a path that is not a detail payload", async () => {
    const e = env();
    const spy = vi.spyOn(e.DETAIL, "get");
    await worker.fetch(get("/data/ui_semantic.json"), e);
    expect(spy).not.toHaveBeenCalled();
  });
});
