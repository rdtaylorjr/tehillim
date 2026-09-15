import { describe, expect, it } from "vitest";
import { trajectoryColumns } from "./trajectoryColumns";
import type { ValidationRow } from "../../../shared/lib/results";

function makeRow(overrides: Partial<ValidationRow> = {}): ValidationRow {
  return {
    model: "bge_m3_vocalized",
    metric: "structural_distance",
    n_pairs_total: 11175,
    n_pairs_valid: 11175,
    raw_gap: 0.12,
    raw_p: 0.001,
    raw_effect_size: 3.2,
    raw_q: 0.004,
    raw_q_by: 0.01,
    length_controlled_gap: 0.08,
    length_controlled_p: 0.02,
    length_controlled_effect_size: 2.1,
    length_controlled_q: 0.05,
    length_controlled_q_by: 0.09,
    length_and_content_controlled_gap: 0.05,
    length_and_content_controlled_p: 0.15,
    length_and_content_controlled_effect_size: 1.0,
    length_and_content_controlled_q: 0.3,
    length_and_content_controlled_q_by: 0.4,
    ...overrides,
  };
}

describe("trajectoryColumns", () => {
  it("shows the chosen control's columns alone, never raw, whose gap tracks length-controlled at r=0.91-0.99", () => {
    expect(trajectoryColumns([makeRow()], "length_controlled").map((c) => c.key)).toEqual([
      "length_controlled_effect_size",
      "length_controlled_gap",
      "length_controlled_p",
      "length_controlled_q",
    ]);
    expect(
      trajectoryColumns([makeRow()], "length_and_content_controlled").map((c) => c.key),
    ).toEqual([
      "length_and_content_controlled_effect_size",
      "length_and_content_controlled_gap",
      "length_and_content_controlled_p",
      "length_and_content_controlled_q",
    ]);
  });

  it("offers no columns for the content control of a content_distance group, the self-covariate case", () => {
    const rows = [
      makeRow({
        metric: "content_distance",
        length_and_content_controlled_gap: NaN,
        length_and_content_controlled_p: NaN,
        length_and_content_controlled_effect_size: NaN,
        length_and_content_controlled_q: NaN,
      }),
    ];
    expect(trajectoryColumns(rows, "length_and_content_controlled")).toEqual([]);
    expect(trajectoryColumns(rows, "length_controlled")).toHaveLength(4);
  });

  it("marks the p and q columns as pills with their prefix, for significance styling", () => {
    const columns = trajectoryColumns([makeRow()], "length_controlled");
    const pills = columns.filter((c) => c.type === "pill").map((c) => [c.key, c.pillPrefix]);
    expect(pills).toEqual([
      ["length_controlled_p", "p"],
      ["length_controlled_q", "q"],
    ]);
  });

  it("labels the statistics bare, since the control is named once above the table", () => {
    const labels = trajectoryColumns([makeRow()], "length_and_content_controlled").map(
      (c) => c.label,
    );
    expect(labels).toEqual(["Effect size", "Gap", "p", "q"]);
  });
});
