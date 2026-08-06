import { allBooks, bookOfPsalm } from "./books";
import {
  createBookColorScale,
  createGunkelFamilyColorScale,
  createGunkelGenreColorScale,
} from "./colorScale";
import type { GunkelPayload } from "../types";

//: The one, shared "what does color mean" choice for both pages' psalm
//: pickers - always a ground-truth category (traditional book division, or
//: one of Gunkel's own two granularities), never cluster assignment, which
//: is shown structurally elsewhere rather than by color (see
//: viz/scatterPlot.ts's hull outlines).
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

/** Builds a `colorOf`/legend pair for whichever reference mode is selected -
 * the single source of truth both psalm-picker grids (Compare and Cluster
 * pages) and the Cluster page's scatter plot use, so switching the one
 * shared dropdown recolors everything consistently. */
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
        label: `${book.name} (${book.range[0]}–${book.range[1]})`,
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
