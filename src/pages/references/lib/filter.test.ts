import { describe, expect, it } from "vitest";
import { countWorks, filterSections, fold, matches, slug, termsOf } from "./filter";
import type { Reference, ReferenceSection } from "../model/types";

const work = (over: Partial<Reference> = {}): Reference => ({
  id: "AAA",
  type: "Journal Article",
  title: "Patterns and Pleasure",
  titleStyle: "quoted",
  containerPrefix: "",
  creators: "Van Peursen, Wido.",
  date: "2018",
  year: 2018,
  container: "HIPHIL Novum",
  detail: "5.2: 126-135",
  url: "",
  ...over,
});

const section = (name: string, entries: Reference[]): ReferenceSection => ({
  name,
  groups: [{ name: null, entries }],
});

describe("fold", () => {
  it("folds case so a query need not match capitalisation", () => {
    expect(fold("Van Peursen")).toBe("van peursen");
  });

  it("strips Latin diacritics, so an unaccented query finds an accented name", () => {
    expect(fold("Günter")).toBe("gunter");
  });

  it("leaves Hebrew alone, whose marks are not accents on Latin letters", () => {
    expect(fold("תהלים")).toBe("תהלים");
  });
});

describe("termsOf", () => {
  it("splits on whitespace and drops the empties", () => {
    expect(termsOf("  peursen   psalm 16 ")).toEqual(["peursen", "psalm", "16"]);
  });

  it("yields nothing for an empty query", () => {
    expect(termsOf("   ")).toEqual([]);
  });
});

describe("matches", () => {
  it("matches every entry when nothing was typed", () => {
    expect(matches(work(), [])).toBe(true);
  });

  it("requires every term, in any order", () => {
    expect(matches(work(), ["peursen", "pleasure"])).toBe(true);
    expect(matches(work(), ["pleasure", "peursen"])).toBe(true);
  });

  it("fails when one term is absent", () => {
    expect(matches(work(), ["peursen", "gunkel"])).toBe(false);
  });

  it("reads the year, the container and the item type as well as the title", () => {
    expect(matches(work(), ["2018"])).toBe(true);
    expect(matches(work(), ["hiphil"])).toBe(true);
    expect(matches(work(), ["journal"])).toBe(true);
  });

  it("falls back to the free-text date where a work carries no year", () => {
    expect(matches(work({ year: null, date: "n.d. 1933" }), ["1933"])).toBe(true);
  });
});

describe("filterSections", () => {
  const sections = [
    section("Hebrew Psalms", [work(), work({ id: "BBB", title: "An older chapter" })]),
    section("Context", [
      work({ id: "CCC", title: "Einleitung", creators: "Gunkel, Hermann." }),
    ]),
  ];

  it("returns the sections untouched for an empty query, so nothing re-renders", () => {
    expect(filterSections(sections, [])).toBe(sections);
  });

  it("keeps only the entries that match", () => {
    const narrowed = filterSections(sections, ["gunkel"]);
    expect(narrowed).toHaveLength(1);
    expect(narrowed[0]?.groups[0]?.entries.map((e) => e.id)).toEqual(["CCC"]);
  });

  it("drops a section the query empties, rather than leaving it standing empty", () => {
    expect(filterSections(sections, ["nothing-matches-this"])).toEqual([]);
  });
});

describe("countWorks", () => {
  it("counts distinct works, since one may be filed in two sections", () => {
    const shared = work({ id: "SHARED" });
    expect(countWorks([section("A", [shared]), section("B", [shared])])).toBe(1);
  });

  it("counts nothing for no sections", () => {
    expect(countWorks([])).toBe(0);
  });
});

describe("slug", () => {
  it("joins its parts into one stable id", () => {
    expect(slug("Hebrew Psalms", "Computational")).toBe("ref-hebrew-psalms--computational");
  });

  it("folds case and diacritics, so an accented name yields a plain id", () => {
    expect(slug("Günter")).toBe("ref-gunter");
  });

  it("collapses punctuation and trims the dashes it leaves behind", () => {
    expect(slug("2. Quantitative / 1. Nested")).toBe("ref-2-quantitative-1-nested");
  });

  it("drops a part that reduces to nothing", () => {
    expect(slug("", "Versions")).toBe("ref-versions");
  });
});
