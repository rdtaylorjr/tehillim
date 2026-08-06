import { scaleOrdinal, scaleSequential } from "d3-scale";
import { interpolateTurbo } from "d3-scale-chromatic";
import { interpolateRgb } from "d3-interpolate";
import { hsl } from "d3-color";

/** Colorful sequential scale for similarity scores, 0 (unrelated) to `max`.
 * Clamped: a value above `max` (deliberately often a high percentile, not
 * the true maximum - see viz/heatmap.ts) still gets the top color rather
 * than extrapolating interpolateTurbo past its intended [0,1] input range,
 * which produces visually wrong colors (it's only defined on that range). */
export function createSimilarityColorScale(
  max: number,
): (value: number) => string {
  if (max <= 0) {
    throw new RangeError(`createSimilarityColorScale: max must be positive, got ${max}`);
  }
  return scaleSequential(interpolateTurbo).domain([0, max]).clamp(true);
}

//: A row-normalized share (0-1, what fraction of a genre's psalms landed
//: in one cluster) rendered in the site's own accent hue rather than a
//: generic d3 categorical scale, so the genre-alignment table reads as
//: part of the same visual system as the rest of the app rather than a
//: bolted-on chart-library widget.
export function createAlignmentColorScale(): (share: number) => string {
  return scaleSequential(interpolateRgb("#faf6ef", "#7c4f2a")).domain([0, 1]);
}

//: Books and Gunkel families are independent categorizations over the
//: same psalms (a traditional division vs. a form-critical one), with no
//: reason to share a color at the same position - Book III is green,
//: the unrelated Royal Psalm family is violet - so they're two separate
//: hue sequences rather than one shared array sliced two ways. Both still
//: draw only from the dataviz skill's documented 8-hue palette
//: (references/palette.md), never generated/interpolated, which is what
//: keeps them reading as "the same design system" rather than three
//: unrelated palettes despite not sharing every slot.
//:
//: BOOK_HUES: slots 1/2/3/4/8, in Book I-V order. Slot 8 red replaces the
//: documented slot 5 magenta so Book V reads as light red, not pink.
//: Validated (--mode light, adjacent pairs): ALL CHECKS PASS.
const BOOK_HUES: readonly string[] = [
  "#2a78d6", // slot 1 blue - Book I
  "#eb6834", // slot 2 orange - Book II
  "#1baf7a", // slot 3 aqua/green - Book III
  "#eda100", // slot 4 yellow - Book IV
  "#e34948", // slot 8 red - Book V
];

export function createBookColorScale(): (book: number) => string {
  return scaleOrdinal<number, string>().domain([1, 2, 3, 4, 5]).range(BOOK_HUES);
}

//: FAMILY_HUES: slots 1/2/7/4/8, in GUNKEL_FAMILIES order (Hymn/Lament/
//: Royal Psalm/Thanksgiving/Wisdom Psalm), plus a hand-picked lighter
//: green for Minor/Mixed Types (the documented dark green #008300 read
//: too heavy against this set). Validated in this exact order (--mode
//: light): CVD separation passes with one adjacent pair (red/green, slots
//: 5-6) in the 6-8 "legal with secondary encoding" band - satisfied by
//: the always-visible legend - every other check (lightness band, chroma
//: floor, normal-vision floor) fully passes.
const FAMILY_HUES: readonly string[] = [
  "#2a78d6", // slot 1 blue - Hymn
  "#eb6834", // slot 2 orange - Lament
  "#4a3aa7", // slot 7 violet - Royal Psalm
  "#eda100", // slot 4 yellow - Thanksgiving
  "#e34948", // slot 8 red - Wisdom Psalm
  "#2e8b3d", // light green - Minor/Mixed Types
];

export function createGunkelFamilyColorScale(families: readonly string[]): (family: string) => string {
  return scaleOrdinal<string, string>()
    .domain(families)
    .range(FAMILY_HUES.slice(0, families.length));
}

//: Splits one family's anchor hue into `count` evenly-spaced lightness
//: steps (same hue/saturation, varying only lightness) - a hue x
//: lightness composite encoding, the technique the dataviz skill names
//: for going past its validated categorical ceiling (choosing-a-form.md:
//: "past it... use composite encoding"). Genres within a family never
//: need to be told apart from genres in a *different* family by shade
//: alone - the hue already does that job - so within-family steps only
//: have to stay distinct from their 0-3 siblings, which a handful of
//: lightness steps on one hue comfortably supports.
export function hueShades(baseHex: string, count: number): string[] {
  if (count <= 1) return [baseHex];
  const base = hsl(baseHex);
  const lightnessMin = 0.36;
  const lightnessMax = 0.72;
  return Array.from({ length: count }, (_, i) => {
    const l = lightnessMin + ((lightnessMax - lightnessMin) * i) / (count - 1);
    return hsl(base.h, base.s, l).formatHex();
  });
}

/** Colors a genre by its family's anchor hue, shaded by the genre's position
 * among its family's other genres - so switching between the 6-family and
 * 14-genre views keeps a visibly consistent hue per family, and a genre
 * always reads as "a shade of its family," never an unrelated color. */
export function createGunkelGenreColorScale(
  genres: readonly string[],
  families: readonly string[],
  genreFamily: ReadonlyMap<string, string>,
): (genre: string) => string {
  const familyColor = createGunkelFamilyColorScale(families);
  const genresByFamily = new Map<string, string[]>();
  for (const genre of genres) {
    const family = genreFamily.get(genre);
    if (!family) continue;
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
    familyGenres.forEach((genre, i) => colorByGenre.set(genre, shades[i]));
  }

  return scaleOrdinal<string, string>()
    .domain(genres)
    .range(genres.map((genre) => colorByGenre.get(genre) ?? "#898781"));
}
