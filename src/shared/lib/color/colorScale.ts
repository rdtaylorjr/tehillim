import { scaleOrdinal, scaleSequential } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

//: A row-normalized share ramped from the panel's inset ground to the accent.
export function createAlignmentColorScale(): (share: number) => string {
  return scaleSequential(interpolateRgb("#23272c", "#7ba3d9")).domain([0, 1]);
}

//: Books and Gunkel families are independent categorizations, so two hue sequences.

//: The blue is the site's accent itself; every other hue is blended 18% toward it in OKLab.

/** One ordered set for every categorical scale, each mode taking as many as it needs from the front. */
export const HUES: readonly string[] = [
  "#7ba3d9",
  "#de8b6e",
  "#69c071",
  "#d7ac57",
  "#e2737b",
  "#b47fdb",
  "#36c0b4",
];

/** Blue, orange, green, gold, red in Book I-V order. */
export const BOOK_HUES: readonly string[] = HUES.slice(0, 5);

export function createBookColorScale(): (book: number) => string {
  return scaleOrdinal<number, string>().domain([1, 2, 3, 4, 5]).range(BOOK_HUES);
}

/** Hymn, Lament, Royal, Thanksgiving, Wisdom, Minor/Mixed: the books' hues by name, Royal keeping the violet. */
export const FAMILY_HUES: readonly string[] = [
  HUES[0],
  HUES[1],
  HUES[5],
  HUES[3],
  HUES[4],
  HUES[2],
].map((hue) => hue ?? "");

export function createGunkelFamilyColorScale(
  families: readonly string[],
): (family: string) => string {
  return scaleOrdinal<string, string>()
    .domain(families)
    .range(FAMILY_HUES.slice(0, families.length));
}

/** Colors a genre by its family's hue, flat, so siblings read as one family and the legend names them. */
export function createGunkelGenreColorScale(
  genres: readonly string[],
  families: readonly string[],
  genreFamily: ReadonlyMap<string, string>,
): (genre: string) => string {
  const familyColor = createGunkelFamilyColorScale(families);
  return scaleOrdinal<string, string>()
    .domain(genres)
    .range(
      genres.map((genre) => {
        const family = genreFamily.get(genre);
        return family === undefined ? "#6b6f76" : familyColor(family);
      }),
    );
}
