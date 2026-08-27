import { describe, expect, it } from "vitest";
import { orderGroups, seriesColor } from "./curveStyle";

describe("seriesColor", () => {
  const palette = { Hymn: "#e69f00", Lament: "#56b4e9" };

  it("returns the accent color for the Combined series", () => {
    expect(seriesColor("Combined", palette, "#7c4f2a", "#948c78")).toBe("#7c4f2a");
  });

  it("returns the palette color for a named series", () => {
    expect(seriesColor("Hymn", palette, "#7c4f2a", "#948c78")).toBe("#e69f00");
  });

  it("falls back to the given fallback color for a name absent from the palette", () => {
    expect(seriesColor("Unknown", palette, "#7c4f2a", "#948c78")).toBe("#948c78");
  });
});

describe("orderGroups", () => {
  interface G {
    key: string;
    label: string;
  }
  const groups: G[] = [
    { key: "Lament", label: "Lament" },
    { key: "different", label: "Different genre" },
    { key: "combined", label: "Same genre (combined)" },
    { key: "Hymn", label: "Hymn" },
  ];

  it("puts combined first, then the canonical order, then the reference group last", () => {
    const ordered = orderGroups(groups, ["Combined", "Hymn", "Lament"]);
    expect(ordered.map((g) => g.key)).toEqual(["combined", "Hymn", "Lament", "different"]);
  });

  it("drops a canonical-order entry that has no matching group", () => {
    const ordered = orderGroups(groups, ["Combined", "Wisdom", "Hymn"]);
    expect(ordered.map((g) => g.key)).toEqual(["combined", "Hymn", "different"]);
  });

  it("treats baseline as the reference key alongside different", () => {
    const withBaseline: G[] = [
      { key: "baseline", label: "Baseline" },
      { key: "combined", label: "Combined" },
      { key: "Synonymous", label: "Synonymous" },
    ];
    const ordered = orderGroups(withBaseline, ["Combined", "Synonymous"]);
    expect(ordered.map((g) => g.key)).toEqual(["combined", "Synonymous", "baseline"]);
  });
});
