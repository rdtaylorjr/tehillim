import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlluvialDiagram } from "./AlluvialDiagram";
import type { GenreAlignment } from "../model";

const alignment = {
  genres: ["Hymn", "Lament"],
  clusterGenreLabels: ["Hymn", null],
  counts: [
    [8, 2],
    [1, 9],
  ],
  genreTotals: [10, 10],
  clusterTotals: [9, 11],
  purity: 0.85,
  ami: 0.4,
  ari: 0.3,
} as unknown as GenreAlignment;

const hue = (): string => "#5b9bea";
const labels = (container: HTMLElement): (string | null)[] =>
  [...container.querySelectorAll("text")].map((t) => t.textContent);

describe("AlluvialDiagram", () => {
  it("names both sides in full", () => {
    const { container } = render(
      <AlluvialDiagram alignment={alignment} genreColorOf={hue} selected={null} />,
    );
    expect(labels(container)).toContain("Hymn (10)");
    expect(labels(container).join(" ")).toContain("Cluster");
  });

  it("keeps the genre names and drops the cluster ones when compact", () => {
    const { container } = render(
      <AlluvialDiagram alignment={alignment} genreColorOf={hue} selected={null} compact />,
    );
    expect(labels(container)).toContain("Hymn");
    expect(labels(container).join(" ")).not.toContain("Cluster");
  });

  it("draws a ribbon per nonzero pairing", () => {
    const { container } = render(
      <AlluvialDiagram alignment={alignment} genreColorOf={hue} selected={null} />,
    );
    expect(container.querySelectorAll("path").length).toBe(4);
  });

  it("renders where the host cannot measure SVG text, rather than throwing", () => {
    expect(() =>
      render(
        <AlluvialDiagram alignment={alignment} genreColorOf={hue} selected={null} compact />,
      ),
    ).not.toThrow();
  });
});
