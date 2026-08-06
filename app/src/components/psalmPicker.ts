import type { ReferenceColoring } from "../lib/referenceColor";
import type { PsalmCore } from "../types";
import { createPsalmGrid, type PsalmGrid } from "./psalmGrid";

export type PsalmPicker = PsalmGrid;

/** The shared psalm-picker grid + legend used identically by both pages -
 * `coloring` (Book / Gunkel family / Gunkel genre - see lib/referenceColor.ts)
 * is the only thing that ever changes it, driven by the one shared
 * reference-color dropdown in the picker header. */
export function createPsalmPicker(
  gridEl: HTMLElement,
  legendEl: HTMLElement,
  psalms: PsalmCore[],
  coloring: ReferenceColoring,
  onSelect: (psalm: number) => void,
): PsalmPicker {
  const grid = createPsalmGrid(gridEl, psalms, coloring.colorOf, onSelect);

  legendEl.innerHTML = "";
  for (const entry of coloring.legend) {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = entry.color;
    const label = document.createElement("span");
    label.textContent = entry.label;
    item.append(swatch, label);
    legendEl.append(item);
  }

  return grid;
}
