import { scaleOrdinal, scaleSequential } from "d3-scale";
import { interpolateTurbo } from "d3-scale-chromatic";
import { interpolateRgb } from "d3-interpolate";
import { hsl } from "d3-color";

/** Sequential scale for similarity, 0 to `max`, clamped at both ends. */
export function createSimilarityColorScale(max: number): (value: number) => string {
  if (max <= 0) {
    throw new RangeError(
      `createSimilarityColorScale: max must be positive, got ${String(max)}`,
    );
  }
  return scaleSequential(interpolateTurbo).domain([0, max]).clamp(true);
}

//: A row-normalized share ramped from the panel's inset ground to the accent.
export function createAlignmentColorScale(): (share: number) => string {
  return scaleSequential(interpolateRgb("#23272c", "#7ba3d9")).domain([0, 1]);
}

//: Books and Gunkel families are independent categorizations, so two hue sequences.

//: BOOK_HUES: palette slots 1/2/3/4/8 in Book I-V order, validated for dark mode.
const BOOK_HUES: readonly string[] = [
  "#5b9bea", // slot 1 blue - Book I
  "#f0824e", // slot 2 orange - Book II
  "#35c491", // slot 3 aqua/green - Book III
  "#e8b53a", // slot 4 yellow - Book IV
  "#ea6a67", // slot 8 red - Book V
];

export function createBookColorScale(): (book: number) => string {
  return scaleOrdinal<number, string>().domain([1, 2, 3, 4, 5]).range(BOOK_HUES);
}

//: FAMILY_HUES: palette slots 1/2/7/4/8 plus a light green, lifted for a dark ground.
const FAMILY_HUES: readonly string[] = [
  "#5b9bea", // slot 1 blue - Hymn
  "#f0824e", // slot 2 orange - Lament
  "#8b7ce0", // slot 7 violet - Royal Psalm
  "#e8b53a", // slot 4 yellow - Thanksgiving
  "#ea6a67", // slot 8 red - Wisdom Psalm
  "#57b968", // light green - Minor/Mixed Types
];

export function createGunkelFamilyColorScale(
  families: readonly string[],
): (family: string) => string {
  return scaleOrdinal<string, string>()
    .domain(families)
    .range(FAMILY_HUES.slice(0, families.length));
}

//: Hue by lightness composite encoding, the ceiling held where sRGB stops clipping.
export function hueShades(baseHex: string, count: number): string[] {
  if (count <= 1) return [baseHex];
  const base = hsl(baseHex);
  const lightnessMin = 0.46;
  const lightnessMax = 0.72;
  return Array.from({ length: count }, (_, i) => {
    const l = lightnessMin + ((lightnessMax - lightnessMin) * i) / (count - 1);
    return hsl(base.h, base.s, l).formatHex();
  });
}

/** Colors a genre by its family's hue, shaded by its position within that family. */
export function createGunkelGenreColorScale(
  genres: readonly string[],
  families: readonly string[],
  genreFamily: ReadonlyMap<string, string>,
): (genre: string) => string {
  const familyColor = createGunkelFamilyColorScale(families);
  const genresByFamily = new Map<string, string[]>();
  for (const genre of genres) {
    const family = genreFamily.get(genre);
    if (family === undefined) continue;
    const list = genresByFamily.get(family);
    if (list) {
      list.push(genre);
    } else {
      genresByFamily.set(family, [genre]);
    }
  }

  const colorByGenre = new Map<string, string>();
  for (const [family, familyGenres] of genresByFamily) {
    const shades = hueShades(familyColor(family), familyGenres.length);
    familyGenres.forEach((genre, i) => {
      const shade = shades[i];
      if (shade !== undefined) colorByGenre.set(genre, shade);
    });
  }

  return scaleOrdinal<string, string>()
    .domain(genres)
    .range(genres.map((genre) => colorByGenre.get(genre) ?? "#6b6f76"));
}
