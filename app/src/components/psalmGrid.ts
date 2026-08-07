import type { PsalmCore } from "../types";

export interface PsalmGrid {
  setSelected(psalm: number | null): void;
  destroy(): void;
}

/** Renders the 150-cell psalm grid used by both pages' pickers - `colorOf`
 * (Book / Gunkel family / Gunkel genre, see lib/referenceColor.ts) is the
 * only thing that ever differs between them. */
export function createPsalmGrid(
  gridEl: HTMLElement,
  psalms: PsalmCore[],
  colorOf: (psalm: number) => string,
  onSelect: (psalm: number) => void,
): PsalmGrid {
  const cells = new Map<number, HTMLButtonElement>();

  gridEl.innerHTML = "";
  for (const { number: psalm } of psalms) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "psalm-cell";
    cell.style.background = colorOf(psalm);
    cell.title = `Psalm ${psalm}`;
    cell.setAttribute("role", "option");
    cell.setAttribute("aria-label", `Psalm ${psalm}`);
    cell.addEventListener("click", () => onSelect(psalm));
    gridEl.append(cell);
    cells.set(psalm, cell);
  }

  let selectedCell: HTMLButtonElement | null = null;

  // Safari can fail to recompute this grid's column count when a media
  // query crosses its breakpoint during a live window resize, leaving
  // stale (often much wider) tracks until something else forces a fresh
  // layout pass - toggling display does that.
  let reflowFrame = 0;
  const forceReflowOnResize = (): void => {
    if (reflowFrame !== 0) return;
    reflowFrame = requestAnimationFrame(() => {
      reflowFrame = 0;
      gridEl.style.display = "none";
      void gridEl.offsetHeight;
      gridEl.style.display = "";
    });
  };
  window.addEventListener("resize", forceReflowOnResize);

  return {
    setSelected(psalm: number | null): void {
      selectedCell?.classList.remove("is-selected");
      selectedCell = psalm !== null ? (cells.get(psalm) ?? null) : null;
      selectedCell?.classList.add("is-selected");
      selectedCell?.scrollIntoView({ block: "nearest" });
    },
    destroy(): void {
      window.removeEventListener("resize", forceReflowOnResize);
      cancelAnimationFrame(reflowFrame);
      cells.clear();
    },
  };
}
