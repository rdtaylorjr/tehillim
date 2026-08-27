import { describe, expect, it } from "vitest";
import { AUTHOR, LINKS, RELEASE_YEAR, SITE, VERSION } from "./attribution";

describe("VERSION", () => {
  it("comes from package.json, so the build is the single source of truth", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("AUTHOR", () => {
  it("links to the author's GitHub profile over https", () => {
    expect(AUTHOR.url).toBe("https://github.com/rdtaylorjr");
  });
});

describe("RELEASE_YEAR", () => {
  it("is a fixed four-digit year rather than the reader's clock", () => {
    expect(RELEASE_YEAR).toMatch(/^\d{4}$/);
  });
});

describe("LINKS", () => {
  it("resolves Text-Fabric through its DOI", () => {
    expect(LINKS.textFabric).toBe("https://doi.org/10.5281/zenodo.592193");
  });

  it("cites BHSA through the identifier its licence requires for attribution", () => {
    expect(LINKS.bhsa).toBe("https://doi.org/10.17026/dans-z6y-skyh");
  });

  it("points at the publisher's page for the dataset that has no DOI", () => {
    expect(LINKS.psalmsExplorer).toMatch(/^https:\/\/www\.logos\.com\//);
  });

  it("uses https everywhere", () => {
    for (const href of Object.values(LINKS)) {
      expect(href).toMatch(/^https:\/\//);
    }
  });
});

describe("SITE", () => {
  it("splits the permanent name from the phrase that explains it", () => {
    expect(SITE.name).toBe("Tehillim");
    expect(SITE.scope).toBe("Computational Analysis of Psalms");
  });

  it("reads as one phrase once joined, the weight contrast standing in for punctuation", () => {
    expect(SITE.title).toBe("Tehillim · Computational Analysis of Psalms");
  });

  it("keeps benchmarks in the subtitle, the line a later phase replaces", () => {
    expect(SITE.subtitle).toBe("Hebrew Psalm Representation Benchmarks");
  });
});
