import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SeriesKey } from "./SeriesKey";

const color = (name: string): string => (name === "Combined" ? "#7ba3d9" : "#c19a44");

describe("SeriesKey", () => {
  it("names every series once, since one key serves all the charts", () => {
    cleanup();
    render(<SeriesKey names={["Combined", "Synonymous"]} color={color} />);
    expect(screen.getByText("Combined")).toBeInTheDocument();
    expect(screen.getByText("Synonymous")).toBeInTheDocument();
  });

  it("carries each series' own colour on its swatch", () => {
    cleanup();
    const { container } = render(<SeriesKey names={["Combined"]} color={color} />);
    const swatch = container.querySelector("[data-swatch]");
    expect(swatch).toHaveStyle({ background: "#7ba3d9" });
  });

  it("renders nothing when there are no series to name", () => {
    cleanup();
    const { container } = render(<SeriesKey names={[]} color={color} />);
    expect(container).toBeEmptyDOMElement();
  });
});
