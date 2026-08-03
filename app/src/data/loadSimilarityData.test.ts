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
  meta: {
    method: "lexical-tfidf-cosine",
    description: "",
    corpus: { name: "ETCBC/BHSA", version: "2021" },
    generatedAt: "2026-01-01T00:00:00Z",
    psalmCount: 2,
  },
  psalmNumbers: [1, 2],
  psalms: [{ number: 1 }, { number: 2 }],
  similar: {},
  matrix: [
    [1, 0.5],
    [0.5, 1],
  ],
};

describe("loadSimilarityData", () => {
  it("resolves with the parsed payload on success", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    const data = await loadSimilarityData("/data/similarity.json", fetcher);
    expect(data.meta.psalmCount).toBe(2);
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
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ matrix: [] }));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(
      DataLoadError,
    );
  });

  it("throws DataLoadError when matrix/psalms sizes mismatch", async () => {
    const malformed = { ...validPayload, matrix: [[1]] };
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
