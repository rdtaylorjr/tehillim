import { describe, expect, it } from "vitest";
import { formatAppVersion } from "./appVersion";

describe("formatAppVersion", () => {
  it("prefixes a semver string with a lowercase v", () => {
    expect(formatAppVersion("0.1.0")).toBe("v0.1.0");
  });

  it("passes through a pre-release/build suffix unchanged", () => {
    expect(formatAppVersion("1.2.3-beta.1")).toBe("v1.2.3-beta.1");
  });
});
