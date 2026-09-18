import { describe, expect, it } from "vitest";
import { INITIAL_SELECTION } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";
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
  genre_registers: [
    { taxonomy: "logos", unit: null, genres: ["Hymn", "Wisdom"] },
    { taxonomy: "gunkel", unit: "song", genres: ["Lament"] },
  ],
  genre_overall: [
    { model: "g", taxonomy: "logos", unit: null },
    { model: "gs", taxonomy: "gunkel", unit: "song" },
  ] as never,
  genre_by_genre: [
    { model: "hymn", genre: "Hymn", taxonomy: "logos", unit: null },
    { model: "wis", genre: "Wisdom", taxonomy: "logos", unit: null },
    { model: "lam", genre: "Lament", taxonomy: "gunkel", unit: "song" },
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
    const view = resolveTableView(DATA, at({ benchmark: "genre", source: "logos" }));
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["g"]);
  });

  it("narrows to the chosen genre's rows", () => {
    const view = resolveTableView(
      DATA,
      at({ benchmark: "genre", source: "logos", genre: "Wisdom" }),
    );
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["wis"]);
  });

  it("reads a source's register at its first unit when none is chosen", () => {
    const view = resolveTableView(DATA, at({ benchmark: "genre" }));
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["gs"]);
  });

  it("narrows to one Gattung and heads its count column with that word", () => {
    const view = resolveTableView(
      DATA,
      at({ benchmark: "genre", unit: "song", genre: "Lament" }),
    );
    expect(view.rows.map((r) => (r as { model: string }).model)).toEqual(["lam"]);
    expect(view.columns.map((c) => c.label)).toContain("n same-gattung");
  });

  it("shows no rows for a source the export never scored", () => {
    const data = { ...DATA, genre_registers: [] };
    const view = resolveTableView(data, at({ benchmark: "genre" }));
    expect(view.rows).toEqual([]);
  });
});

describe("resolveTableView columns", () => {
  it("gives every permutation its own column set", () => {
    const labels = (s: Selection): string[] =>
      resolveTableView(DATA, s).columns.map((c) => c.label);

    expect(labels(INITIAL_SELECTION)).toContain("MRR (fwd)");
    expect(labels(at({ benchmark: "genre" }))).toContain("AUC 95% CI");
    expect(labels(at({ benchmark: "genre", genre: "Lament" }))).toContain("n same-gattung");
  });
});

describe("resolveTableView with no data", () => {
  it("yields no rows rather than failing", () => {
    expect(resolveTableView(EMPTY_DOMAIN_DATA, INITIAL_SELECTION).rows).toEqual([]);
  });
});
