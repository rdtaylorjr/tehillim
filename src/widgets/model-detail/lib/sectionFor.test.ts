import { describe, expect, it } from "vitest";
import { sectionFor } from "./sectionFor";
import { INITIAL_SELECTION } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";
import type { GenreRegister } from "../../../shared/lib/results";

const at = (over: Partial<Selection>): Selection => ({ ...INITIAL_SELECTION, ...over });

const REGISTERS: GenreRegister[] = [
  { taxonomy: "logos", unit: null, genres: ["Hymn"] },
  { taxonomy: "gunkel", unit: "song", genres: ["Hymn"] },
  { taxonomy: "gunkel", unit: "song_component", genres: ["Hymn"] },
];

describe("sectionFor", () => {
  it("shows parallelism when that benchmark is chosen", () => {
    expect(sectionFor(at({ benchmark: "parallelism" }), REGISTERS)).toBe("parallelism");
  });

  it("shows parallelism regardless of which type is filtered to", () => {
    expect(
      sectionFor(at({ benchmark: "parallelism", parallelismType: "Synonymous" }), REGISTERS),
    ).toBe("parallelism");
  });

  it("names the register's section under the genre benchmark", () => {
    expect(sectionFor(at({ benchmark: "genre", source: "logos" }), REGISTERS)).toBe(
      "genre_logos",
    );
    expect(sectionFor(at({ benchmark: "genre", unit: "song_component" }), REGISTERS)).toBe(
      "genre_gunkel_song_component",
    );
  });

  it("falls to a source's first unit when none is chosen", () => {
    expect(sectionFor(at({ benchmark: "genre" }), REGISTERS)).toBe("genre_gunkel_song");
  });

  it("has no section while the export names no register for the source", () => {
    expect(sectionFor(at({ benchmark: "genre" }), [])).toBeNull();
  });
});
