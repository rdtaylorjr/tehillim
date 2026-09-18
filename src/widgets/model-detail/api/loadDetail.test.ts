import { describe, expect, it, vi } from "vitest";
import { createDetailLoader } from "./loadDetail";

const payload = { model: "berel", domain: "semantic", genre_logos: { heatmap: [] } };
const ok = (): Response => new Response(JSON.stringify(payload), { status: 200 });

describe("createDetailLoader", () => {
  it("loads the section the selection determined", async () => {
    const fetcher = vi.fn(() => Promise.resolve(ok()));
    const load = createDetailLoader(fetcher);
    expect(await load("semantic", "berel", "genre_logos")).toEqual({
      status: "loaded",
      data: payload,
    });
    expect(fetcher).toHaveBeenCalledWith(
      `/data/detail_semantic_berel_genre_logos.json?v=${__DETAIL_VERSION__}`,
    );
  });

  it("reports absence rather than throwing when a model has no export", async () => {
    const load = createDetailLoader(() => Promise.resolve(new Response("", { status: 404 })));
    expect(await load("semantic", "absent", "genre_logos")).toEqual({ status: "absent" });
  });

  it("reports failure when the payload is not valid JSON", async () => {
    const load = createDetailLoader(() =>
      Promise.resolve(new Response("{oops", { status: 200 })),
    );
    expect(await load("semantic", "berel", "genre_logos")).toEqual({ status: "failed" });
  });

  it("reports failure when the request itself rejects", async () => {
    const load = createDetailLoader(() => Promise.reject(new Error("offline")));
    expect(await load("semantic", "berel", "genre_logos")).toEqual({ status: "failed" });
  });

  it("serves a repeated request from cache rather than fetching twice", async () => {
    const fetcher = vi.fn(() => Promise.resolve(ok()));
    const load = createDetailLoader(fetcher);
    await load("semantic", "berel", "genre_logos");
    await load("semantic", "berel", "genre_logos");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retries after a failure rather than caching the failure", async () => {
    const fetcher = vi
      .fn(() => Promise.resolve(ok()))
      .mockImplementationOnce(() => Promise.reject(new Error("offline")));
    const load = createDetailLoader(fetcher);
    expect(await load("semantic", "berel", "genre_logos")).toEqual({ status: "failed" });
    expect(await load("semantic", "berel", "genre_logos")).toEqual({
      status: "loaded",
      data: payload,
    });
  });
});
