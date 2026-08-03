import { describe, expect, it } from "vitest";
import { allBooks, bookOfPsalm } from "./books";

describe("bookOfPsalm", () => {
  it("assigns psalm 1 to Book I", () => {
    expect(bookOfPsalm(1).name).toBe("Book I");
  });

  it("assigns psalm 41 (end of Book I) correctly", () => {
    expect(bookOfPsalm(41).index).toBe(1);
  });

  it("assigns psalm 42 (start of Book II) correctly", () => {
    expect(bookOfPsalm(42).index).toBe(2);
  });

  it("assigns psalm 89 (end of Book III) correctly", () => {
    expect(bookOfPsalm(89).index).toBe(3);
  });

  it("assigns psalm 90 (start of Book IV) correctly", () => {
    expect(bookOfPsalm(90).index).toBe(4);
  });

  it("assigns psalm 107 (start of Book V) correctly", () => {
    expect(bookOfPsalm(107).index).toBe(5);
  });

  it("assigns psalm 150 (end of Book V) correctly", () => {
    expect(bookOfPsalm(150).index).toBe(5);
  });

  it("throws for psalm number 0", () => {
    expect(() => bookOfPsalm(0)).toThrow(RangeError);
  });

  it("throws for psalm number 151", () => {
    expect(() => bookOfPsalm(151)).toThrow(RangeError);
  });
});

describe("allBooks", () => {
  it("returns exactly five books covering 1-150 with no gaps or overlaps", () => {
    const books = allBooks();
    expect(books).toHaveLength(5);
    expect(books[0].range[0]).toBe(1);
    expect(books[books.length - 1].range[1]).toBe(150);
    for (let i = 1; i < books.length; i++) {
      expect(books[i].range[0]).toBe(books[i - 1].range[1] + 1);
    }
  });
});
