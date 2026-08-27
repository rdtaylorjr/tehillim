import { describe, expect, it } from "vitest";
import { clickedRow } from "./clickedRow";
import { EMPTY_DOMAIN_DATA } from "../../../shared/lib/results";
import type { DomainData } from "../../../shared/lib/results";
import { INITIAL_SELECTION } from "../../../shared/lib/selection";
import type { Selection } from "../../../shared/lib/selection";

const at = (over: Partial<Selection>): Selection => ({ ...INITIAL_SELECTION, ...over });

const DATA: DomainData = {
  ...EMPTY_DOMAIN_DATA,
  parallelism_overall: [
    { model: "berel", separation_auc: 0.84 },
    { model: "alephbert", separation_auc: 0.69 },
  ] as never,
};

describe("clickedRow", () => {
  it("finds the opened model's row and the columns the table showed it in", () => {
    const found = clickedRow(DATA, at({ model: "berel" }), []);
    expect(found?.row).toEqual({ model: "berel", separation_auc: 0.84 });
    expect(found?.columns.some((c) => c.label === "Separation AUC")).toBe(true);
  });

  it("yields nothing when no model is open", () => {
    expect(clickedRow(DATA, INITIAL_SELECTION, [])).toBeNull();
  });

  it("yields nothing when the open model is not among the rows", () => {
    expect(clickedRow(DATA, at({ model: "absent" }), [])).toBeNull();
  });
});
