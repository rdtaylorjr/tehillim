import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PsalmPicker } from "./PsalmPicker";
import { createReferenceColoring } from "../../../shared/lib/color";
import { GUNKEL, PSALMS } from "../../../test/fixtures";

function setup(
  mode: "book" | "family" | "genre" = "book",
  selected: number | null = 1,
): { onSelect: ReturnType<typeof vi.fn>; onColorModeChange: ReturnType<typeof vi.fn> } {
  const onSelect = vi.fn();
  const onColorModeChange = vi.fn();
  render(
    <PsalmPicker
      psalms={PSALMS}
      coloring={createReferenceColoring(mode, GUNKEL)}
      selected={selected}
      onSelect={onSelect}
      onColorModeChange={onColorModeChange}
    />,
  );
  return { onSelect, onColorModeChange };
}

/** Scoped to the grid: the "Color by" select contributes option roles too. */
const grid = (): HTMLElement => screen.getByRole("listbox", { name: "Select a psalm" });
const cells = (): HTMLElement[] => within(grid()).getAllByRole("option");

describe("PsalmPicker", () => {
  it("renders one cell per psalm, labelled by number", () => {
    setup();
    expect(cells().map((c) => c.getAttribute("aria-label"))).toEqual([
      "Psalm 1",
      "Psalm 2",
      "Psalm 3",
    ]);
  });

  it("exposes the grid as a listbox so the selection reads as one choice", () => {
    setup();
    expect(grid()).toBeInTheDocument();
  });

  it("marks only the selected psalm as selected", () => {
    setup("book", 2);
    const selected = cells().filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected.map((c) => c.getAttribute("aria-label"))).toEqual(["Psalm 2"]);
  });

  it("marks nothing selected when nothing is", () => {
    setup("book", null);
    expect(cells().every((c) => c.getAttribute("aria-selected") === "false")).toBe(true);
  });

  it("reports the psalm a reader clicks", () => {
    const { onSelect } = setup();
    fireEvent.click(within(grid()).getByRole("option", { name: "Psalm 3" }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("reports a psalm typed into the jump field", () => {
    const { onSelect } = setup();
    fireEvent.change(screen.getByLabelText("Jump to Psalm"), { target: { value: "2" } });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("ignores a jump-field number outside the psalter", () => {
    const { onSelect } = setup();
    const field = screen.getByLabelText("Jump to Psalm");
    for (const value of ["0", "151", "", "abc"]) {
      fireEvent.change(field, { target: { value } });
    }
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("offers the three reference colorings and reports a change", () => {
    const { onColorModeChange } = setup();
    const select = screen.getByLabelText("Color by");
    expect([...(select as HTMLSelectElement).options].map((o) => o.value)).toEqual([
      "book",
      "family",
      "genre",
    ]);
    fireEvent.change(select, { target: { value: "genre" } });
    expect(onColorModeChange).toHaveBeenCalledWith("genre");
  });

  it("shows the five books in the legend under book coloring", () => {
    setup("book");
    const legend = screen.getByRole("list", { name: "Color legend" });
    expect(within(legend).getAllByRole("listitem")).toHaveLength(5);
    expect(legend.textContent).toContain("Book I (1–41)");
  });

  it("shows the payload's own families in the legend under family coloring", () => {
    setup("family");
    const legend = screen.getByRole("list", { name: "Color legend" });
    expect(
      within(legend)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Hymn", "Lament"]);
  });

  it("still renders a cell for an unclassified psalm", () => {
    // Psalm 3 has no Gunkel category, so it gets a transparent swatch rather than a hole.
    setup("family");
    expect(within(grid()).getByRole("option", { name: "Psalm 3" })).toBeInTheDocument();
  });

  it("colors two psalms in the same book alike and two in different books differently", () => {
    setup("book");
    const coloring = createReferenceColoring("book", GUNKEL);
    expect(coloring.colorOf(1)).toBe(coloring.colorOf(41));
    expect(coloring.colorOf(1)).not.toBe(coloring.colorOf(42));
  });
});
