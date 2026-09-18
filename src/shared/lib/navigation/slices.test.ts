import { describe, expect, it } from "vitest";
import { INITIAL_SELECTION } from "./selection";
import { sliceFor } from "./slices";

const REGISTERS = [
  { taxonomy: "logos", unit: null, genres: ["Hymn"] },
  { taxonomy: "gunkel", unit: "song", genres: ["Hymnus"] },
];

describe("sliceFor", () => {
  it("asks for nothing while the table needs only the core payload", () => {
    expect(sliceFor(INITIAL_SELECTION, REGISTERS)).toBeNull();
    expect(sliceFor({ ...INITIAL_SELECTION, benchmark: "genre" }, REGISTERS)).toBeNull();
  });

  it("names the per-class genre slice of the register in view once a class is chosen", () => {
    expect(
      sliceFor(
        { ...INITIAL_SELECTION, benchmark: "genre", source: "logos", genre: "Hymn" },
        REGISTERS,
      ),
    ).toEqual({ table: "genre_by_genre", name: "genre_logos" });
    expect(
      sliceFor({ ...INITIAL_SELECTION, benchmark: "genre", genre: "Hymnus" }, REGISTERS),
    ).toEqual({ table: "genre_by_genre", name: "genre_gunkel_song" });
  });

  it("asks for nothing under a source the payload lacks", () => {
    expect(
      sliceFor(
        { ...INITIAL_SELECTION, benchmark: "genre", source: "gunkel", genre: "Hymnus" },
        REGISTERS.slice(0, 1),
      ),
    ).toBeNull();
  });
});
