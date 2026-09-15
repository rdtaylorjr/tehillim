import { describe, expect, it } from "vitest";
import { modelNames } from "./modelNames";
import { INITIAL_SELECTION } from "../../../shared/lib/navigation";
import type { DomainData } from "../../../shared/lib/results";

const row = (model: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  model,
  model_base: model,
  text_variant: "unknown",
  ...extra,
});

const data = (over: Partial<Record<string, unknown[]>>): DomainData => ({
  parallelism_overall: [],
  parallelism_by_type: [],
  genre_overall: [],
  genre_by_genre: [],
  trajectory: [],
  trajectory_by_genre: [],
  ...over,
});

describe("modelNames", () => {
  it("lists the models of the current selection, in the table's order", () => {
    const result = modelNames(
      data({ parallelism_overall: [row("berel"), row("alephbert")] }),
      INITIAL_SELECTION,
      [],
    );
    expect(result).toEqual(["berel", "alephbert"]);
  });

  it("names only the models scored under the chosen control, each once", () => {
    const slice = [
      {
        ...row("berel"),
        metric: "content_distance",
        genre: "Hymn",
        source: "length_controlled",
      },
      {
        ...row("berel"),
        metric: "content_distance",
        genre: "Hymn",
        source: "length_and_content_controlled",
      },
      {
        ...row("alephbert"),
        metric: "content_distance",
        genre: "Hymn",
        source: "length_controlled",
      },
    ];
    const result = modelNames(
      data({}),
      { ...INITIAL_SELECTION, benchmark: "genre", metric: "content_distance", genre: "Hymn" },
      slice,
    );
    expect(result).toEqual(["berel", "alephbert"]);
  });
});
