import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { VERSION } from "../../../shared/lib/attribution";

describe("Footer", () => {
  it("links to the author's GitHub profile", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /rdtaylorjr/i })).toHaveAttribute(
      "href",
      "https://github.com/rdtaylorjr",
    );
  });

  it("shows the build version and the release year", () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(`v${VERSION}`))).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("acknowledges the BHSA and Text-Fabric at reachable homes", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "BHSA" })).toHaveAttribute(
      "href",
      "https://github.com/ETCBC/bhsa",
    );
    expect(screen.getByRole("link", { name: "Text-Fabric" })).toHaveAttribute(
      "href",
      "https://doi.org/10.5281/zenodo.592193",
    );
  });

  it("names the Logos dataset as its product page does, and notes the permission", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Logos Psalms Explorer" })).toBeInTheDocument();
    expect(screen.getByText(/used with permission/i)).toBeInTheDocument();
  });

  it("opens external links safely in a new tab", () => {
    render(<Footer />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });

  it("is a landmark, so it can be reached without hunting", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
