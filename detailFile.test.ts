import { describe, expect, it } from "vitest";
import { detailFileFor } from "./detailFile";

describe("detailFileFor", () => {
  it("maps a detail request to its file on disk", () => {
    expect(detailFileFor("/data/detail_semantic_berel_genre.json")).toBe(
      "detail_semantic_berel_genre.json",
    );
  });

  it("ignores a query string, which the browser may append", () => {
    expect(detailFileFor("/data/detail_semantic_berel_genre.json?v=2")).toBe(
      "detail_semantic_berel_genre.json",
    );
  });

  it("declines anything that is not a detail payload", () => {
    expect(detailFileFor("/data/ui_semantic.json")).toBeNull();
    expect(detailFileFor("/index.html")).toBeNull();
    expect(detailFileFor("/")).toBeNull();
  });

  it("refuses a path that tries to escape the data directory", () => {
    expect(detailFileFor("/data/detail_../../etc/passwd")).toBeNull();
    expect(detailFileFor("/data/detail_a/b.json")).toBeNull();
  });
});
