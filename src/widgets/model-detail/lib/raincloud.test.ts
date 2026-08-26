import { describe, expect, it } from "vitest";
import { MIN_N_FOR_DENSITY, raincloudRowLabel } from "./raincloud";

describe("raincloudRowLabel", () => {
  it("labels a group at or above the density floor with just its n", () => {
    const label = raincloudRowLabel({ label: "Hymn", n: 40 });
    expect(label.thin).toBe(false);
    expect(label.y0).toBe("Hymn (n=40)");
  });

  it("labels a thin group below the density floor as raw-only", () => {
    const label = raincloudRowLabel({ label: "Wisdom", n: 12 });
    expect(label.thin).toBe(true);
    expect(label.y0).toBe(`Wisdom (n=12) · raw only, n<${String(MIN_N_FOR_DENSITY)}`);
  });

  it("treats the density floor itself as not thin", () => {
    const label = raincloudRowLabel({ label: "X", n: MIN_N_FOR_DENSITY });
    expect(label.thin).toBe(false);
  });
});
