import { describe, expect, it, vi } from "vitest";
import {
  DataLoadError,
  loadClusteringData,
  loadGunkelData,
  loadSimilarityData,
} from "./loadPayloads";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(body),
  } as Response;
}

const psalms = [
  { number: 1, verseCount: 6, wordCount: 90, incipit: "..." },
  { number: 2, verseCount: 12, wordCount: 100, incipit: "..." },
];

const validSimilarity = {
  generatedAt: "2026-01-01T00:00:00Z",
  corpus: { name: "ETCBC/BHSA", version: "2021" },
  psalms,
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

const validClustering = {
  generatedAt: "2026-01-01T00:00:00Z",
  corpus: { name: "ETCBC/BHSA", version: "2021" },
  psalms,
  clusterMethods: [
    {
      id: "lexical-spectral",
      description: "test method",
      nClusters: 2,
      assignments: { "1": 0, "2": 1 },
      clusters: [
        { index: 0, size: 1, psalmNumbers: [1] },
        { index: 1, size: 1, psalmNumbers: [2] },
      ],
      embedding: { x: [0, 1], y: [0, 1] },
      genreAlignment: {},
      familyAlignment: {},
    },
  ],
  defaultClusterMethod: "lexical-spectral",
};

const makeGunkelPsalms = (
  count = 150,
): { number: number; genre: string | null; family: string | null }[] =>
  Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    genre: "Hymn",
    family: "Hymn",
  }));

const validGunkel = {
  generatedAt: "2026-01-01T00:00:00Z",
  genres: ["Hymn", "Individual Lament"],
  families: ["Hymn", "Lament"],
  psalms: makeGunkelPsalms(),
};

describe("loadSimilarityData", () => {
  it("resolves with the parsed payload on success", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validSimilarity));
    const data = await loadSimilarityData("/data/detail_similarity.json", fetcher);
    expect(data.psalms).toHaveLength(2);
    expect(data.defaultMethod).toBe("lexical-tfidf-cosine");
  });

  it("requests the given url", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validSimilarity));
    await loadSimilarityData("/data/detail_similarity.json", fetcher);
    expect(fetcher).toHaveBeenCalledWith("/data/detail_similarity.json");
  });

  it("defaults to the R2-served detail path when no url is given", async () => {
    //: The matrices ride the /data/detail_ prefix the Worker routes to storage.
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validSimilarity));
    await loadSimilarityData(undefined, fetcher);
    expect(fetcher.mock.calls[0]?.[0]).toContain("data/detail_similarity.json");
  });

  it("throws DataLoadError on a non-ok HTTP response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, false, 404));
    await expect(loadSimilarityData("/missing.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when psalms is missing", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ methods: [] }));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when methods is missing", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...validSimilarity, methods: undefined }));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when methods is empty", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...validSimilarity, methods: [] }));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when a method's matrix/psalms sizes mismatch", async () => {
    const malformed = {
      ...validSimilarity,
      methods: [{ ...validSimilarity.methods[0], matrix: [[1]] }],
    };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when defaultMethod matches no method id", async () => {
    const malformed = { ...validSimilarity, defaultMethod: "does-not-exist" };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadSimilarityData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("propagates network-level rejections from fetch", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(loadSimilarityData("/x.json", fetcher)).rejects.toThrow("network down");
  });
});

describe("loadClusteringData", () => {
  it("resolves with the parsed payload on success", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validClustering));
    const data = await loadClusteringData("/data/clustering.json", fetcher);
    expect(data.clusterMethods).toHaveLength(1);
    expect(data.defaultClusterMethod).toBe("lexical-spectral");
  });

  it("accepts a payload with no kStability or structureCaptured at all", async () => {
    //: Loading must succeed so the UI drops two diagnostics rather than the page.
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validClustering));
    const data = await loadClusteringData("/data/clustering.json", fetcher);
    expect(data.clusterMethods[0]?.kStability).toBeUndefined();
    expect(data.clusterMethods[0]?.embedding.structureCaptured).toBeUndefined();
  });

  it("throws DataLoadError on a non-ok HTTP response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, false, 404));
    await expect(loadClusteringData("/missing.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when clusterMethods is missing", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...validClustering, clusterMethods: undefined }));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when clusterMethods is empty", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...validClustering, clusterMethods: [] }));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when assignments and psalms disagree in size", async () => {
    const malformed = {
      ...validClustering,
      clusterMethods: [{ ...validClustering.clusterMethods[0], assignments: { "1": 0 } }],
    };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when defaultClusterMethod matches no method id", async () => {
    const malformed = { ...validClustering, defaultClusterMethod: "does-not-exist" };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadClusteringData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });
});

describe("loadGunkelData", () => {
  it("resolves with the parsed payload on success", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validGunkel));
    const data = await loadGunkelData("/data/gunkel.json", fetcher);
    expect(data.psalms).toHaveLength(150);
    expect(data.genres).toContain("Hymn");
  });

  it("requests the given url", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validGunkel));
    await loadGunkelData("/data/gunkel.json", fetcher);
    expect(fetcher).toHaveBeenCalledWith("/data/gunkel.json");
  });

  it("throws DataLoadError on a non-ok HTTP response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, false, 404));
    await expect(loadGunkelData("/missing.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when genres is missing", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...validGunkel, genres: undefined }));
    await expect(loadGunkelData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when the psalm count is not 150", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...validGunkel, psalms: makeGunkelPsalms(5) }));
    await expect(loadGunkelData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("propagates network-level rejections from fetch", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(loadGunkelData("/x.json", fetcher)).rejects.toThrow("network down");
  });
});
