import { describe, expect, it, vi } from "vitest";
import { DataLoadError, loadClusteringData } from "./loadClusteringData";

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
  clusterMethods: [
    {
      id: "verb-morphology-spectral",
      description: "test cluster method",
      nClusters: 2,
      assignments: { "1": 0, "2": 1 },
      clusters: [
        { index: 0, size: 1, psalmNumbers: [1] },
        { index: 1, size: 1, psalmNumbers: [2] },
      ],
    },
  ],
  defaultClusterMethod: "verb-morphology-spectral",
};

describe("loadClusteringData", () => {
  it("resolves with the parsed payload on success", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    const data = await loadClusteringData("/data/clustering.json", fetcher);
    expect(data.psalms).toHaveLength(2);
    expect(data.defaultClusterMethod).toBe("verb-morphology-spectral");
  });

  it("requests the given url", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    await loadClusteringData("/data/clustering.json", fetcher);
    expect(fetcher).toHaveBeenCalledWith("/data/clustering.json");
  });

  it("throws DataLoadError on a non-ok HTTP response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, false, 404));
    await expect(loadClusteringData("/missing.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when psalms is missing", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ clusterMethods: [] }));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when clusterMethods is missing", async () => {
    const malformed = { ...validPayload, clusterMethods: undefined };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when clusterMethods is empty", async () => {
    const malformed = { ...validPayload, clusterMethods: [] };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when a method's assignments count doesn't match psalms", async () => {
    const malformed = {
      ...validPayload,
      clusterMethods: [{ ...validPayload.clusterMethods[0], assignments: { "1": 0 } }],
    };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when defaultClusterMethod matches no method", async () => {
    const malformed = { ...validPayload, defaultClusterMethod: "does-not-exist" };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("propagates network-level rejections from fetch", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(loadClusteringData("/x.json", fetcher)).rejects.toThrow("network down");
  });
});
