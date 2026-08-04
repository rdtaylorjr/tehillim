import { allBooks, bookOfPsalm } from "../lib/books";
import { createBookColorScale } from "../lib/colorScale";
import type { PsalmCore } from "../types";

export interface PsalmPicker {
  setSelected(psalm: number | null): void;
  destroy(): void;
}

export function createPsalmPicker(
  gridEl: HTMLElement,
  legendEl: HTMLElement,
  psalms: PsalmCore[],
  onSelect: (psalm: number) => void,
): PsalmPicker {
  const colorScale = createBookColorScale();
  const cells = new Map<number, HTMLButtonElement>();

  gridEl.innerHTML = "";
  for (const { number: psalm } of psalms) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "psalm-cell";
    cell.style.background = colorScale(bookOfPsalm(psalm).index);
    cell.title = `Psalm ${psalm}`;
    cell.setAttribute("role", "option");
    cell.setAttribute("aria-label", `Psalm ${psalm}`);
    cell.addEventListener("click", () => onSelect(psalm));
    gridEl.append(cell);
    cells.set(psalm, cell);
  }

  legendEl.innerHTML = "";
  for (const book of allBooks()) {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = colorScale(book.index);
    const label = document.createElement("span");
    label.textContent = `${book.name} (${book.range[0]}–${book.range[1]})`;
    item.append(swatch, label);
    legendEl.append(item);
  }

  let selectedCell: HTMLButtonElement | null = null;

  return {
    setSelected(psalm: number | null): void {
      selectedCell?.classList.remove("is-selected");
      selectedCell = psalm !== null ? (cells.get(psalm) ?? null) : null;
      selectedCell?.classList.add("is-selected");
      selectedCell?.scrollIntoView({ block: "nearest" });
    },
    destroy(): void {
      cells.clear();
    },
  };
}
