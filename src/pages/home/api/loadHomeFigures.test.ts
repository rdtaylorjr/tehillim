import { describe, expect, it, vi } from "vitest";
import { HOME_FIGURES_URL, loadHomeFigures } from "./loadHomeFigures";

const figures = {
  benchmark: { rows: [] },
  compare: { psalms: [1], matrix: [[1]], domainMax: 0.2 },
  cluster: { alignment: { genres: [] } },
};

const ok = (): ReturnType<typeof vi.fn> =>
  vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(figures) });

describe("loadHomeFigures", () => {
  it("returns the payload the cards draw", async () => {
    await expect(loadHomeFigures("/data/home_figures.json", ok())).resolves.toEqual(figures);
  });

  it("stamps the default URL with the build version, so a stale copy cannot persist", () => {
    expect(HOME_FIGURES_URL).toContain("data/home_figures.json?v=");
  });

  it("fetches the default URL when none is given", async () => {
    const fetcher = ok();
    await loadHomeFigures(undefined, fetcher);
    expect(fetcher.mock.calls[0]?.[0]).toBe(HOME_FIGURES_URL);
  });

  it("names the status when the payload cannot be reached", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(loadHomeFigures("/data/home_figures.json", fetcher)).rejects.toThrow("404");
  });
});
