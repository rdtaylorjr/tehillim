import { describe, expect, it, vi } from "vitest";
import { createDomainCache, createSliceCache } from "./domainCache";

const ok = (body: unknown): Response =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as Response;
const status = (code: number): Response =>
  ({ ok: false, status: code, json: () => Promise.reject(new Error("no body")) }) as Response;

describe("createDomainCache", () => {
  it("fetches a family once, however often it is asked for", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ semantic: {} }));
    const load = createDomainCache(fetcher);

    await load("semantic");
    await load("semantic");
    await load("semantic");

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps families apart", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ semantic: {} }));
    const load = createDomainCache(fetcher);

    await load("semantic");
    await load("lexical");

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("shares one request between callers that ask before it settles", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ semantic: {} }));
    const load = createDomainCache(fetcher);

    await Promise.all([load("semantic"), load("semantic")]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("remembers an absent family, which will not appear on a retry", async () => {
    const fetcher = vi.fn().mockResolvedValue(status(404));
    const load = createDomainCache(fetcher);

    expect(await load("syntactic")).toEqual({ status: "absent" });
    await load("syntactic");

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retries a failure, which may well succeed the next time", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(status(500))
      .mockResolvedValue(ok({ semantic: {} }));
    const load = createDomainCache(fetcher);

    expect(await load("semantic")).toEqual({ status: "failed" });
    expect(await load("semantic")).toMatchObject({ status: "loaded" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe("createSliceCache", () => {
  const sliceBody = (genre: string): Response =>
    ({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ semantic: { genre_by_genre: [{ model: "a", genre }] } }),
    }) as Response;

  it("fetches one family and slice once", async () => {
    const fetcher = vi.fn().mockResolvedValue(sliceBody("Hymnus"));
    const load = createSliceCache(fetcher);

    await load("semantic", "genre_by_genre", "genre_gunkel_song");
    await load("semantic", "genre_by_genre", "genre_gunkel_song");

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps slices of one family apart", async () => {
    const fetcher = vi.fn().mockResolvedValue(sliceBody("Hymnus"));
    const load = createSliceCache(fetcher);

    await load("semantic", "genre_by_genre", "genre_logos");
    await load("semantic", "genre_by_genre", "genre_gunkel_song");

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("yields no rows where the export holds no such slice", async () => {
    const fetcher = vi.fn().mockResolvedValue(status(404));
    const load = createSliceCache(fetcher);
    await expect(load("syntactic", "genre_by_genre", "genre_gunkel_song")).resolves.toEqual([]);
  });
});
