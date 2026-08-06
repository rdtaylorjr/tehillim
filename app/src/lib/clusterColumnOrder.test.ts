import { describe, expect, it } from "vitest";
import { orderClustersByGenre } from "./clusterColumnOrder";

const GENRE_ORDER = ["Hymn", "Individual Lament", "Royal Psalm"];

describe("orderClustersByGenre", () => {
  it("orders matched clusters by their genre's position in genreOrder", () => {
    // cluster 0 -> Royal Psalm (last), cluster 1 -> Hymn (first)
    const order = orderClustersByGenre(["Royal Psalm", "Hymn"], GENRE_ORDER);
    expect(order).toEqual([1, 0]);
  });

  it("appends unmatched clusters after matched ones, in original index order", () => {
    const order = orderClustersByGenre(["Individual Lament", null, "Hymn", null], GENRE_ORDER);
    expect(order).toEqual([2, 0, 1, 3]);
  });

  it("preserves original order when every cluster is unmatched", () => {
    const order = orderClustersByGenre([null, null, null], GENRE_ORDER);
    expect(order).toEqual([0, 1, 2]);
  });
});
