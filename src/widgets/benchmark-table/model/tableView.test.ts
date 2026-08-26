import { describe, expect, it } from "vitest";
import { INITIAL_SELECTION } from "../../../shared/lib/selection";
import type { Selection } from "../../../shared/lib/selection";
import { EMPTY_DOMAIN_DATA } from "../../../shared/lib/results";
import type { DomainData } from "../../../shared/lib/results";
import { resolveTableView } from "./tableView";

const at = (over: Partial<Selection>): Selection => ({ ...INITIAL_SELECTION, ...over });

const DATA: DomainData = {
  ...EMPTY_DOMAIN_DATA,
  parallelism_overall: [{ model: "a", scope: undefined }] as never,
  parallelism_by_type: [
    { model: "syn", scope: "Synonymous" },
    { model: "ant", scope: "Antithetic" },
  ] as never,
  genre_overall: [{ model: "g" }] as never,
  genre_by_genre: [
    { model: "hymn", genre: "Hymn" },
    { model: "wis", genre: "Wisdom" },
  ] as never,
  trajectory: [
    { model: "t1", metric: "structural_distance", length_controlled_p: 0.01 },
    { model: "t2", metric: "turning_angle_distance", length_controlled_p: 0.01 },
  ] as never,
  trajectory_by_genre: [
    { model: "tg1", metric: "structural_distance", genre: "Hymn" },
    { model: "tg2", metric: "structural_distance", genre: "Wisdom" },
  ] as never,
};

describe("resolveTableView parallelism", () => {
  it("uses the overall rows while no type is chosen", () => {
    const view = resolveTableView(DATA, INITIAL_SELECTION);
    expect(view.rows).toHaveLength(1);
    expect(view.defaultSortKey).toBe("separation_auc");
  });

  it("narrows to the chosen type's rows", () => {
    const view = resolveTableView(DATA, at({ parallelismType: "Synonymous" }));
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["syn"]);
  });
});

describe("resolveTableView genre discrimination", () => {
  it("uses the overall rows while no genre is chosen", () => {
    const view = resolveTableView(DATA, at({ benchmark: "genre" }));
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["g"]);
  });

  it("narrows to the chosen genre's rows", () => {
    const view = resolveTableView(DATA, at({ benchmark: "genre", genre: "Wisdom" }));
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["wis"]);
  });
});

describe("resolveTableView trajectory", () => {
  it("switches to the trajectory rows for the chosen metric", () => {
    const view = resolveTableView(
      DATA,
      at({ benchmark: "genre", metric: "structural_distance" }),
    );
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["t1"]);
  });

  it("leads on effect size, the headline metric for a gap test", () => {
    const view = resolveTableView(
      DATA,
      at({ benchmark: "genre", metric: "structural_distance" }),
    );
    expect(view.defaultSortKey).toBe("raw_effect_size");
  });

  it("narrows to one genre and leads on the gap itself", () => {
    const view = resolveTableView(
      DATA,
      at({ benchmark: "genre", metric: "structural_distance", genre: "Hymn" }),
    );
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["tg1"]);
    expect(view.defaultSortKey).toBe("gap");
  });
});

describe("resolveTableView columns", () => {
  it("gives every permutation its own column set", () => {
    const labels = (s: Selection): string[] =>
      resolveTableView(DATA, s).columns.map((c) => c.label);

    expect(labels(INITIAL_SELECTION)).toContain("MRR (fwd)");
    expect(labels(at({ benchmark: "genre" }))).toContain("AUC 95% CI");
    expect(labels(at({ benchmark: "genre", metric: "structural_distance" }))).toContain(
      "Effect size",
    );
    expect(
      labels(at({ benchmark: "genre", metric: "structural_distance", genre: "Hymn" })),
    ).toContain("Source");
  });
});

describe("resolveTableView with no data", () => {
  it("yields no rows rather than failing", () => {
    expect(resolveTableView(EMPTY_DOMAIN_DATA, INITIAL_SELECTION).rows).toEqual([]);
  });
});
