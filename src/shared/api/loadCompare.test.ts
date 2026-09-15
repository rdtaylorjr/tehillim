import { describe, expect, it, vi } from "vitest";
import { DataLoadError } from "./loadPayloads";
import { compareMethodUrl, createCompareMethodLoader, loadCompareIndex } from "./loadCompare";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(body),
  } as Response;
}

const method = {
  id: "lexeme_icf-mean-pool-cosine",
  description: "Cosine similarity between mean-pooled half-verse embeddings.",
  domain: "lexical",
  representation: "lexeme_icf",
  modelBase: "lexeme_icf",
  textVariant: null,
  aggregation: "mean-pool",
  correction: null,
};

const validIndex = {
  generatedAt: "2026-01-01T00:00:00Z",
  corpus: { name: "ETCBC/BHSA", version: "2021" },
  psalms: [
    { number: 1, verseCount: 6, wordCount: 90, incipit: "..." },
    { number: 2, verseCount: 12, wordCount: 100, incipit: "..." },
  ],
  methods: [method],
  defaultMethod: "lexeme_icf-mean-pool-cosine",
};

const validData = {
  id: "lexeme_icf-mean-pool-cosine",
  psalmNumbers: [1, 2],
  similar: {},
  matrix: [
    [1, 0.5],
    [0.5, 1],
  ],
};

describe("loadCompareIndex", () => {
  it("resolves with the parsed index and requests the given url", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validIndex));
    const index = await loadCompareIndex("/data/compare.json", fetcher);
    expect(index.methods.map((m) => m.id)).toEqual(["lexeme_icf-mean-pool-cosine"]);
    expect(fetcher).toHaveBeenCalledWith("/data/compare.json");
  });

  it("defaults to the shipped index path", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validIndex));
    await loadCompareIndex(undefined, fetcher);
    expect(fetcher.mock.calls[0]?.[0]).toContain("data/compare.json");
  });

  it("throws DataLoadError on a non-ok response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, false, 404));
    await expect(loadCompareIndex("/missing.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when methods are missing or empty", async () => {
    for (const body of [{ psalms: [] }, { ...validIndex, methods: [] }]) {
      const fetcher = vi.fn().mockResolvedValue(jsonResponse(body));
      await expect(loadCompareIndex("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
    }
  });

  it("throws DataLoadError when the default method names no method", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...validIndex, defaultMethod: "nope" }));
    await expect(loadCompareIndex("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });
});

describe("createCompareMethodLoader", () => {
  it("fetches a method's file by id, versioned like the detail files", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validData));
    const load = createCompareMethodLoader(fetcher);
    const result = await load("lexeme_icf-mean-pool-cosine");
    expect(result).toEqual({ status: "loaded", data: validData });
    expect(fetcher).toHaveBeenCalledWith(compareMethodUrl("lexeme_icf-mean-pool-cosine"));
    expect(compareMethodUrl("x")).toContain("data/detail_compare_x.json?v=");
  });

  it("caches a loaded method and refetches after a failure", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, false, 500))
      .mockResolvedValue(jsonResponse(validData));
    const load = createCompareMethodLoader(fetcher);
    expect((await load("m")).status).toBe("failed");
    expect((await load("m")).status).toBe("loaded");
    await load("m");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("reports a missing file as absent and a malformed one as failed", async () => {
    const absent = createCompareMethodLoader(
      vi.fn().mockResolvedValue(jsonResponse(null, false, 404)),
    );
    expect((await absent("m")).status).toBe("absent");
    const malformed = createCompareMethodLoader(
      vi.fn().mockResolvedValue(jsonResponse({ ...validData, matrix: [[1]] })),
    );
    expect((await malformed("m")).status).toBe("failed");
  });
});
