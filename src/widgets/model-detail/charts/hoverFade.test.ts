import { describe, expect, it, vi } from "vitest";
import { createHoverFade } from "./hoverFade";

describe("createHoverFade", () => {
  it("dims the other traces as soon as one is hovered", () => {
    const dim = vi.fn();
    const fade = createHoverFade(dim, vi.fn(), 90);
    fade.enter(2);
    expect(dim).toHaveBeenCalledWith(2);
  });

  it("does not restore the instant the cursor leaves a trace", () => {
    const restore = vi.fn();
    const fade = createHoverFade(vi.fn(), restore, 90);
    fade.enter(0);
    fade.leave();
    expect(restore).not.toHaveBeenCalled();
  });

  it("restores once the cursor has stayed away", () => {
    vi.useFakeTimers();
    const restore = vi.fn();
    const fade = createHoverFade(vi.fn(), restore, 90);
    fade.enter(0);
    fade.leave();
    vi.advanceTimersByTime(90);
    expect(restore).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("never restores while crossing from one trace straight to another", () => {
    vi.useFakeTimers();
    const restore = vi.fn();
    const dim = vi.fn();
    const fade = createHoverFade(dim, restore, 90);
    fade.enter(0);
    fade.leave();
    vi.advanceTimersByTime(40);
    fade.enter(1);
    vi.advanceTimersByTime(200);
    expect(restore).not.toHaveBeenCalled();
    expect(dim).toHaveBeenLastCalledWith(1);
    vi.useRealTimers();
  });

  it("drops a pending restore when it is torn down", () => {
    vi.useFakeTimers();
    const restore = vi.fn();
    const fade = createHoverFade(vi.fn(), restore, 90);
    fade.enter(0);
    fade.leave();
    fade.dispose();
    vi.advanceTimersByTime(200);
    expect(restore).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
