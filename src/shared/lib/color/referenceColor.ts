import { allBooks, bookOfPsalm } from "../corpus";
import {
  createBookColorScale,
  createGunkelFamilyColorScale,
  createGunkelGenreColorScale,
} from "./colorScale";
import type { GunkelPayload } from "../../model/types";

//: The shared colour choice, always a ground-truth category, never a cluster.
export type ReferenceColorMode = "book" | "family" | "genre";

export interface ReferenceLegendEntry {
  label: string;
  color: string;
}

export interface ReferenceColoring {
  mode: ReferenceColorMode;
  colorOf: (psalm: number) => string;
  legend: ReferenceLegendEntry[];
}

const UNCLASSIFIED_COLOR = "transparent";

/** A `colorOf` and legend pair for the selected mode, shared by every view. */
export function createReferenceColoring(
  mode: ReferenceColorMode,
  gunkel: GunkelPayload,
): ReferenceColoring {
  if (mode === "book") {
    const scale = createBookColorScale();
    return {
      mode,
      colorOf: (psalm) => scale(bookOfPsalm(psalm).index),
      legend: allBooks().map((book) => ({
        label: `${book.name} (${String(book.range[0])}–${String(book.range[1])})`,
        color: scale(book.index),
      })),
    };
  }

  if (mode === "family") {
    const scale = createGunkelFamilyColorScale(gunkel.families);
    const familyByPsalm = new Map(gunkel.psalms.map((p) => [p.number, p.family]));
    return {
      mode,
      colorOf: (psalm) => {
        const family = familyByPsalm.get(psalm);
        return family ? scale(family) : UNCLASSIFIED_COLOR;
      },
      legend: gunkel.families.map((family) => ({ label: family, color: scale(family) })),
    };
  }

  const genreFamily = new Map<string, string>();
  for (const psalm of gunkel.psalms) {
    if (psalm.genre && psalm.family) genreFamily.set(psalm.genre, psalm.family);
  }
  const scale = createGunkelGenreColorScale(gunkel.genres, gunkel.families, genreFamily);
  const genreByPsalm = new Map(gunkel.psalms.map((p) => [p.number, p.genre]));
  return {
    mode,
    colorOf: (psalm) => {
      const genre = genreByPsalm.get(psalm);
      return genre ? scale(genre) : UNCLASSIFIED_COLOR;
    },
    legend: gunkel.genres.map((genre) => ({ label: genre, color: scale(genre) })),
  };
}
