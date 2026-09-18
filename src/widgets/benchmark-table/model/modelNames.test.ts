import { describe, expect, it } from "vitest";
import { modelNames } from "./modelNames";
import { INITIAL_SELECTION } from "../../../shared/lib/navigation";
import { EMPTY_DOMAIN_DATA } from "../../../shared/lib/results";
import type { DomainData } from "../../../shared/lib/results";

const row = (model: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  model,
  model_base: model,
  text_variant: "unknown",
  ...extra,
});

const data = (over: Partial<Record<keyof DomainData, unknown[]>>): DomainData =>
  ({ ...EMPTY_DOMAIN_DATA, ...over }) as DomainData;

describe("modelNames", () => {
  it("lists the models of the current selection, in the table's order", () => {
    const result = modelNames(
      data({ parallelism_overall: [row("berel"), row("alephbert")] }),
      INITIAL_SELECTION,
    );
    expect(result).toEqual(["berel", "alephbert"]);
  });

  it("names a model once however many registers scored it", () => {
    const genre_overall = [
      { ...row("berel"), taxonomy: "gunkel", unit: "song" },
      { ...row("alephbert"), taxonomy: "gunkel", unit: "song" },
      { ...row("berel"), taxonomy: "logos", unit: null },
    ];
    const genre_registers = [{ taxonomy: "gunkel", unit: "song", genres: ["Hymn"] }];
    const result = modelNames(data({ genre_overall, genre_registers }), {
      ...INITIAL_SELECTION,
      benchmark: "genre",
    });
    expect(result).toEqual(["berel", "alephbert"]);
  });
});
