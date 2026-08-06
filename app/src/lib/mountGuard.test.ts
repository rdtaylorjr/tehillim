import { describe, expect, it } from "vitest";
import { createMountGuard } from "./mountGuard";

describe("createMountGuard", () => {
  it("is not stale immediately after claiming a turn", () => {
    const guard = createMountGuard();
    const { isStale } = guard.next();
    expect(isStale()).toBe(false);
  });

  it("marks an earlier turn stale once a later turn is claimed", () => {
    const guard = createMountGuard();
    const first = guard.next();
    const second = guard.next();
    expect(first.isStale()).toBe(true);
    expect(second.isStale()).toBe(false);
  });

  it("marks every earlier turn stale, not just the immediately preceding one", () => {
    const guard = createMountGuard();
    const first = guard.next();
    guard.next();
    const third = guard.next();
    expect(first.isStale()).toBe(true);
    expect(third.isStale()).toBe(false);
  });

  it("each guard instance tracks its own turns independently", () => {
    const guardA = createMountGuard();
    const guardB = createMountGuard();
    const a = guardA.next();
    guardB.next();
    // A second claim on guardB must not affect guardA's only claim.
    expect(a.isStale()).toBe(false);
  });
});
