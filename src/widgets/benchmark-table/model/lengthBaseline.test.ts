import { describe, expect, it } from "vitest";
import { baselineLine, lengthBaseline } from "./lengthBaseline";
import { INITIAL_SELECTION } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";
import { EMPTY_DOMAIN_DATA } from "../../../shared/lib/results";
import type { DomainData, GenreBaselineRow } from "../../../shared/lib/results";

const at = (over: Partial<Selection>): Selection => ({ ...INITIAL_SELECTION, ...over });

const row = (taxonomy: string, unit: string | null, predictor: string): GenreBaselineRow => ({
  taxonomy,
  unit,
  predictor,
  average_precision: 0.2712,
  separation_auc: 0.5301,
  prevalence: 0.25,
  n_same_genre: 100,
  n_different_genre: 300,
});

const DATA: DomainData = {
  ...EMPTY_DOMAIN_DATA,
  genre_registers: [
    { taxonomy: "logos", unit: null, genres: ["Hymn"] },
    { taxonomy: "gunkel", unit: "song", genres: ["Hymn"] },
  ],
  genre_baseline: [
    row("logos", null, "shorter_side"),
    row("logos", null, "length_agreement"),
    row("gunkel", "song", "shorter_side"),
  ],
};

describe("lengthBaseline", () => {
  it("gives the register in view its predictors, in the export's order", () => {
    expect(
      lengthBaseline(DATA, at({ benchmark: "genre", source: "logos" })).map((r) => r.predictor),
    ).toEqual(["shorter_side", "length_agreement"]);
    expect(lengthBaseline(DATA, at({ benchmark: "genre" })).map((r) => r.unit)).toEqual([
      "song",
    ]);
  });

  it("gives nothing outside the overall discrimination view, whose rows it is read against", () => {
    expect(lengthBaseline(DATA, INITIAL_SELECTION)).toEqual([]);
    expect(lengthBaseline(DATA, at({ benchmark: "genre", genre: "Hymn" }))).toEqual([]);
  });

  it("gives nothing while the export names no register for the source", () => {
    expect(
      lengthBaseline({ ...DATA, genre_registers: [] }, at({ benchmark: "genre" })),
    ).toEqual([]);
  });
});

describe("baselineLine", () => {
  it("states the predictor and its scores at four places, with the prevalence AP is read against", () => {
    expect(baselineLine(row("logos", null, "shorter_side"))).toBe(
      "Length alone, shorter side: AUC 0.5301, AP 0.2712 at prevalence 0.2500",
    );
  });
});
