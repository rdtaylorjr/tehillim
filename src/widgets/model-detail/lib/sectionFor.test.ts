import { describe, expect, it } from "vitest";
import { sectionFor } from "./sectionFor";
import { INITIAL_SELECTION } from "../../../shared/lib/selection";
import type { Selection } from "../../../shared/lib/selection";

const at = (over: Partial<Selection>): Selection => ({ ...INITIAL_SELECTION, ...over });

describe("sectionFor", () => {
  it("shows parallelism when that benchmark is chosen", () => {
    expect(sectionFor(at({ benchmark: "parallelism" }))).toBe("parallelism");
  });

  it("shows parallelism regardless of which type is filtered to", () => {
    expect(sectionFor(at({ benchmark: "parallelism", parallelismType: "Synonymous" }))).toBe(
      "parallelism",
    );
  });

  it("shows genre when the metric is genre discrimination", () => {
    expect(sectionFor(at({ benchmark: "genre", metric: "genre" }))).toBe("genre");
  });

  it("shows trajectory when the metric is a trajectory distance", () => {
    expect(sectionFor(at({ benchmark: "genre", metric: "structural_distance" }))).toBe(
      "trajectory",
    );
    expect(sectionFor(at({ benchmark: "genre", metric: "turning_angle_distance" }))).toBe(
      "trajectory",
    );
  });

  it("still shows trajectory when a single genre is filtered to", () => {
    expect(
      sectionFor(at({ benchmark: "genre", metric: "content_distance", genre: "Wisdom" })),
    ).toBe("trajectory");
  });
});
