import { describe, expect, it, vi } from "vitest";
import { DataLoadError, loadGunkelData } from "./loadGunkelData";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(body),
  } as Response;
}

function makePsalms(): { number: number; genre: string | null; family: string | null }[] {
  return Array.from({ length: 150 }, (_, i) => ({
    number: i + 1,
    genre: "Hymn",
    family: "Hymn",
  }));
}

const validPayload = {
  generatedAt: "2026-01-01T00:00:00Z",
  genres: ["Hymn", "Individual Lament"],
  families: ["Hymn", "Lament"],
  psalms: makePsalms(),
};

describe("loadGunkelData", () => {
  it("resolves with the parsed payload on success", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    const data = await loadGunkelData("/data/gunkel.json", fetcher);
    expect(data.psalms).toHaveLength(150);
    expect(data.genres).toContain("Hymn");
  });

  it("requests the given url", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    await loadGunkelData("/data/gunkel.json", fetcher);
    expect(fetcher).toHaveBeenCalledWith("/data/gunkel.json");
  });

  it("throws DataLoadError on a non-ok HTTP response", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, false, 404));
    await expect(loadGunkelData("/missing.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when genres is missing", async () => {
    const malformed = { ...validPayload, genres: undefined };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadGunkelData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("throws DataLoadError when psalms count is not 150", async () => {
    const malformed = { ...validPayload, psalms: makePsalms().slice(0, 5) };
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(malformed));
    await expect(loadGunkelData("/bad.json", fetcher)).rejects.toThrow(DataLoadError);
  });

  it("propagates network-level rejections from fetch", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(loadGunkelData("/x.json", fetcher)).rejects.toThrow("network down");
  });
});
