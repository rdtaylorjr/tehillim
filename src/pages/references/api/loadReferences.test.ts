import { describe, expect, it, vi } from "vitest";
import {
  REFERENCES_BIB_URL,
  REFERENCES_URL,
  ReferencesLoadError,
  loadReferences,
} from "./loadReferences";

const payload = { collection: "Tehillim", count: 1, sections: [] };
const ok = (): ReturnType<typeof vi.fn> =>
  vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) });

describe("loadReferences", () => {
  it("returns the bibliography the page renders", async () => {
    await expect(loadReferences("/data/references.json", ok())).resolves.toEqual(payload);
  });

  it("fetches the committed payload when no url is given", async () => {
    const fetcher = ok();
    await loadReferences(undefined, fetcher);
    expect(fetcher.mock.calls[0]?.[0]).toBe(REFERENCES_URL);
    expect(REFERENCES_URL).toContain("data/references.json");
  });

  it("offers the same works as BibTeX at a matching url", () => {
    expect(REFERENCES_BIB_URL).toContain("data/references.bib");
  });

  it("names the status when the payload cannot be reached", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503, statusText: "Unavailable" });
    await expect(loadReferences("/data/references.json", fetcher)).rejects.toThrow(
      ReferencesLoadError,
    );
    await expect(loadReferences("/data/references.json", fetcher)).rejects.toThrow("503");
  });

  it("refuses a payload carrying no sections, rather than rendering an empty page", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ count: 0 }) });
    await expect(loadReferences("/data/references.json", fetcher)).rejects.toThrow(
      /missing sections/i,
    );
  });
});
