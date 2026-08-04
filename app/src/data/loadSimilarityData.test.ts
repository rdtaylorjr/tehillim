import { describe, expect, it, vi } from "vitest";
import { DataLoadError, loadSimilarityData } from "./loadSimilarityData";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(body),
  } as Response;
}

const validPayload = {
  generatedAt: "2026-01-01T00:00:00Z",
  corpus: { name: "ETCBC/BHSA", version: "2021" },
  psalms: [
    { number: 1, verseCount: 6, wordCount: 90, incipit: "..." },
    { number: 2, verseCount: 12, wordCount: 100, incipit: "..." },
  ],
  methods: [
    {
      id: "lexical-tfidf-cosine",
      description: "test method",
      psalmNumbers: [1, 2],
      psalmStats: [],
      similar: {},
      matrix: [
        [1, 0.5],
        [0.5, 1],
      ],
    },
  ],
  defaultMethod: "lexical-tfidf-cosine",
};

describe("loadSimilarityData", () => {
  it("resolves with the parsed payload on success", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    const data = await loadSimilarityData("/data/similarity.json", fetcher);
    expect(data.psalms).toHaveLength(2);
    expect(data.defaultMethod).toBe("lexical-tfidf-cosine");
  });

  it("requests the given url", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    await loadSimilarityData("/data/similarity.json", fetcher);
    expect(fetcher).toHaveBeenCalledWith("/data/similarity.json");
  });

  it("throws DataLoadError on a non-ok HTTP response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, false, 404));
    await expect(loadSimilarityData("/missing.json", fetcher)).rejects.toThrow(
      DataLoadError,
    );
  });

  it("throws DataLoadError when psalms is missing", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ methods: [] }));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(
      DataLoadError,
    );
  });

  it("throws DataLoadError when methods is missing", async () => {
    const malformed = { ...validPayload, methods: undefined };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(
      DataLoadError,
    );
  });

  it("throws DataLoadError when methods is empty", async () => {
    const malformed = { ...validPayload, methods: [] };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(
      DataLoadError,
    );
  });

  it("throws DataLoadError when a method's matrix/psalms sizes mismatch", async () => {
    const malformed = {
      ...validPayload,
      methods: [{ ...validPayload.methods[0], matrix: [[1]] }],
    };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(
      DataLoadError,
    );
  });

  it("throws DataLoadError when defaultMethod does not match any method id", async () => {
    const malformed = { ...validPayload, defaultMethod: "does-not-exist" };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(
      DataLoadError,
    );
  });

  it("propagates network-level rejections from fetch", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(loadSimilarityData("/x.json", fetcher)).rejects.toThrow(
      "network down",
    );
  });
});
