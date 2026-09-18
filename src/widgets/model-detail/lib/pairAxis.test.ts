import { describe, expect, it } from "vitest";
import { passageAxis } from "./pairAxis";

describe("passageAxis", () => {
  it("keeps the export's passage labels and keys cells by passage id", () => {
    const axis = passageAxis(
      [
        { item: "9:1-5", psalm: 9, label: "Ps 9:1-5", genre: "Hymn" },
        { item: "23", psalm: 23, label: "Ps 23", genre: "Trust" },
      ],
      [{ item_a: "9:1-5", item_b: "23", value: 0.25 }],
    );
    expect(axis.order).toEqual([
      { key: "9:1-5", label: "Ps 9:1-5", genre: "Hymn" },
      { key: "23", label: "Ps 23", genre: "Trust" },
    ]);
    expect(axis.cells).toEqual([{ a: "9:1-5", b: "23", value: 0.25 }]);
  });
});
