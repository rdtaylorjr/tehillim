import { describe, expect, it } from "vitest";
import { registerKey, resolveRegister } from "./registers";
import { INITIAL_SELECTION } from "./selection";
import type { GenreRegister } from "../results";

const REGISTERS: GenreRegister[] = [
  { taxonomy: "logos", unit: null, genres: ["Hymn", "Lament"] },
  { taxonomy: "gunkel", unit: "song", genres: ["Hymnus"] },
  { taxonomy: "gunkel", unit: "song_component", genres: ["Hymnus", "Klagelied"] },
];

describe("resolveRegister", () => {
  it("reads the whole-psalm source with no unit", () => {
    expect(resolveRegister(REGISTERS, { ...INITIAL_SELECTION, source: "logos" })).toEqual(
      REGISTERS[0],
    );
  });

  it("settles a source with units on its first register until one is chosen", () => {
    expect(resolveRegister(REGISTERS, { ...INITIAL_SELECTION, source: "gunkel" })).toEqual(
      REGISTERS[1],
    );
    expect(
      resolveRegister(REGISTERS, {
        ...INITIAL_SELECTION,
        source: "gunkel",
        unit: "song_component",
      }),
    ).toEqual(REGISTERS[2]);
  });

  it("falls back to the first register when the asked-for unit is not in the data", () => {
    expect(
      resolveRegister(REGISTERS, { ...INITIAL_SELECTION, source: "gunkel", unit: "stanza" }),
    ).toEqual(REGISTERS[1]);
  });

  it("returns null for a source the payload lacks", () => {
    expect(
      resolveRegister(REGISTERS.slice(0, 1), { ...INITIAL_SELECTION, source: "gunkel" }),
    ).toBeNull();
  });
});

describe("registerKey", () => {
  it("names a register the way the export names its files", () => {
    expect(registerKey({ taxonomy: "logos", unit: null })).toBe("logos");
    expect(registerKey({ taxonomy: "gunkel", unit: "song_component" })).toBe(
      "gunkel_song_component",
    );
  });
});
