import { scaleOrdinal, scaleSequential } from "d3-scale";
import { interpolateTurbo } from "d3-scale-chromatic";

/** Colorful sequential scale for similarity scores, 0 (unrelated) to `max` (identical). */
export function createSimilarityColorScale(
  max: number,
): (value: number) => string {
  if (max <= 0) {
    throw new RangeError(`createSimilarityColorScale: max must be positive, got ${max}`);
  }
  return scaleSequential(interpolateTurbo).domain([0, max]);
}

//: One color per traditional book of the Psalter (I-V), chosen for
//: distinctness against both light and dark UI backgrounds.
const BOOK_COLORS: readonly string[] = [
  "#e63946", // Book I
  "#f4a261", // Book II
  "#2a9d8f", // Book III
  "#457b9d", // Book IV
  "#8338ec", // Book V
];

export function createBookColorScale(): (book: number) => string {
  return scaleOrdinal<number, string>().domain([1, 2, 3, 4, 5]).range(BOOK_COLORS);
}
