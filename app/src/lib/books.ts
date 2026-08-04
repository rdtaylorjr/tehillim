/** The traditional five-book division of the Psalter. */

export interface PsalmBook {
  index: 1 | 2 | 3 | 4 | 5;
  name: string;
  range: readonly [number, number];
}

const BOOKS: readonly PsalmBook[] = [
  { index: 1, name: "Book I", range: [1, 41] },
  { index: 2, name: "Book II", range: [42, 72] },
  { index: 3, name: "Book III", range: [73, 89] },
  { index: 4, name: "Book IV", range: [90, 106] },
  { index: 5, name: "Book V", range: [107, 150] },
];

export function bookOfPsalm(psalmNumber: number): PsalmBook {
  const book = BOOKS.find(
    (b) => psalmNumber >= b.range[0] && psalmNumber <= b.range[1],
  );
  if (!book) {
    throw new RangeError(`Psalm number out of range (1-150): ${psalmNumber}`);
  }
  return book;
}

export function allBooks(): readonly PsalmBook[] {
  return BOOKS;
}
