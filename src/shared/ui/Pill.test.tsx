import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ciPill, significancePill } from "./Pill";

const show = (node: React.ReactNode): HTMLElement => {
  render(<div data-testid="cell">{node}</div>);
  return screen.getByTestId("cell");
};

describe("significancePill", () => {
  it("renders nothing for a non-finite value", () => {
    expect(show(significancePill(NaN))).toBeEmptyDOMElement();
  });

  it("marks a value below 0.01 as good", () => {
    expect(show(significancePill(0.005)).querySelector(".pill")).toHaveClass("good");
  });

  it("marks a value below 0.05 as warn", () => {
    expect(show(significancePill(0.03)).querySelector(".pill")).toHaveClass("warn");
  });

  it("marks anything from 0.05 up as bad", () => {
    expect(show(significancePill(0.2)).querySelector(".pill")).toHaveClass("bad");
  });

  it("floors tiny values rather than printing a misleading zero", () => {
    expect(show(significancePill(0.0000001))).toHaveTextContent("p=<0.001");
  });

  it("takes the q prefix when asked", () => {
    expect(show(significancePill(0.02, "q"))).toHaveTextContent("q=0.0200");
  });
});

describe("ciPill", () => {
  it("is good when the whole interval clears the reference", () => {
    expect(show(ciPill(0.61, 0.72, 0.5)).querySelector(".pill")).toHaveClass("good");
  });

  it("is bad when the interval touches or crosses the reference", () => {
    expect(show(ciPill(0.48, 0.72, 0.5)).querySelector(".pill")).toHaveClass("bad");
  });

  it("prints the range to four decimals", () => {
    expect(show(ciPill(0.5810729, 0.6683094, 0.5))).toHaveTextContent("[0.5811, 0.6683]");
  });

  it("falls back to an em dash when a bound is missing", () => {
    expect(show(ciPill(NaN, 0.7, 0.5))).toHaveTextContent("—");
  });
});
