import { describe, expect, it, vi } from "vitest";
import { dataUrl, loadDomainData } from "./domainData";

const ok = (body: unknown): Response =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as Response;
const status = (code: number): Response =>
  ({ ok: false, status: code, json: () => Promise.reject(new Error("no body")) }) as Response;
const unparseable = (): Response =>
  ({
    ok: true,
    status: 200,
    json: () => Promise.reject(new SyntaxError("Unexpected token")),
  }) as Response;

describe("dataUrl", () => {
  it("names one file per model family", () => {
    expect(dataUrl("semantic")).toBe("/data/ui_semantic.json");
    expect(dataUrl("lexical")).toBe("/data/ui_lexical.json");
  });

  it("is relative to the deployed base, so a subpath deployment still resolves", () => {
    expect(dataUrl("syntax").startsWith(import.meta.env.BASE_URL)).toBe(true);
  });
});

describe("loadDomainData", () => {
  it("unwraps the family's own key", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(ok({ semantic: { parallelism_overall: [{ model: "a" }] } }));
    const result = await loadDomainData("semantic", fetcher);
    expect(result).toMatchObject({ status: "loaded" });
    expect(result.status === "loaded" && result.data.parallelism_overall).toEqual([
      { model: "a" },
    ]);
  });

  it("fills every section the file omits, so callers never guard", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ semantic: {} }));
    const result = await loadDomainData("semantic", fetcher);
    expect(result.status === "loaded" && result.data.genre_by_genre).toEqual([]);
  });

  it("reports a never-benchmarked family as absent without asking the network", async () => {
    const fetcher = vi.fn();
    await expect(loadDomainData("phonology", fetcher)).resolves.toEqual({ status: "absent" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reports a benchmarked family whose file is missing as absent", async () => {
    const fetcher = vi.fn().mockResolvedValue(status(404));
    await expect(loadDomainData("semantic", fetcher)).resolves.toEqual({ status: "absent" });
  });

  it("reports a payload without the family's key as absent", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ lexical: {} }));
    await expect(loadDomainData("syntax", fetcher)).resolves.toEqual({ status: "absent" });
  });

  it("reports a server error as a failure rather than as missing data", async () => {
    const fetcher = vi.fn().mockResolvedValue(status(500));
    await expect(loadDomainData("semantic", fetcher)).resolves.toEqual({ status: "failed" });
  });

  it("reports an unreachable host as a failure", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(loadDomainData("semantic", fetcher)).resolves.toEqual({ status: "failed" });
  });

  it("reports an unparseable body as a failure, since the results do exist", async () => {
    const fetcher = vi.fn().mockResolvedValue(unparseable());
    await expect(loadDomainData("semantic", fetcher)).resolves.toEqual({ status: "failed" });
  });

  it("carries a null statistic through, the exporter's own mark for one it could not compute", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(ok({ semantic: { trajectory: [{ model: "a", raw_gap: null }] } }));
    const result = await loadDomainData("semantic", fetcher);
    expect(result.status === "loaded" && result.data.trajectory[0]).toMatchObject({
      raw_gap: null,
    });
  });

  it("requests the file for the family it was asked about", async () => {
    const fetcher = vi.fn().mockResolvedValue(ok({ syntax: {} }));
    await loadDomainData("syntax", fetcher);
    expect(fetcher).toHaveBeenCalledWith(dataUrl("syntax"));
  });
});
