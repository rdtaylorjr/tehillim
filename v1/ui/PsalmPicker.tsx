import { useEffect, useId, useRef } from "react";
import styles from "./PsalmPicker.module.css";
import panel from "./Layout.module.css";
import type { ReferenceColoring, ReferenceColorMode } from "../lib/referenceColor";
import type { PsalmCore } from "../model/types";

//: Static, page-independent options - unlike the method pickers (whose options
//: come from fetched data), these choices never vary, so the control is
//: genuinely identical on both pages.
const COLOR_OPTIONS: readonly { value: ReferenceColorMode; label: string }[] = [
  { value: "book", label: "Books" },
  { value: "family", label: "Gunkel Genres (6)" },
  { value: "genre", label: "Gunkel Genres (14)" },
];

export interface PsalmPickerProps {
  readonly psalms: readonly PsalmCore[];
  readonly coloring: ReferenceColoring;
  readonly selected: number | null;
  readonly onSelect: (psalm: number) => void;
  readonly onColorModeChange: (mode: ReferenceColorMode) => void;
}

/** The shared psalm-picker panel used identically by both pages: a jump-to
 * field, the one "what does color mean" choice, the 150-cell grid, and the
 * legend for whichever coloring is active. */
export function PsalmPicker({
  psalms,
  coloring,
  selected,
  onSelect,
  onColorModeChange,
}: PsalmPickerProps): React.ReactElement {
  const searchId = useId();
  const colorId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Selecting from a visualization should bring the matching cell into view,
  // but typing a number must not yank the field the reader is still using.
  useEffect(() => {
    if (selected === null) return;
    if (document.activeElement === searchRef.current) return;
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <section className={`${panel.panel} ${styles.pickerPanel}`} aria-label="Psalm picker">
      <div className={styles.pickerHeader}>
        <label htmlFor={searchId}>Jump to Psalm</label>
        <input
          id={searchId}
          ref={searchRef}
          type="number"
          min={1}
          max={psalms.length}
          placeholder="1&ndash;150"
          autoComplete="off"
          defaultValue={selected ?? ""}
          key={selected ?? "none"}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isInteger(value) && value >= 1 && value <= psalms.length) {
              onSelect(value);
            }
          }}
        />
      </div>
      <div className={styles.pickerHeader}>
        <label htmlFor={colorId}>Color by</label>
        <select
          id={colorId}
          value={coloring.mode}
          onChange={(event) => {
            const chosen = COLOR_OPTIONS.find((o) => o.value === event.target.value);
            if (chosen) onColorModeChange(chosen.value);
          }}
        >
          {COLOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.psalmGrid} role="listbox" aria-label="Select a psalm">
        {psalms.map((psalm) => {
          const isSelected = psalm.number === selected;
          return (
            <button
              key={psalm.number}
              ref={isSelected ? selectedRef : null}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={`Psalm ${String(psalm.number)}`}
              title={`Psalm ${String(psalm.number)}`}
              className={`${styles.psalmCell}${isSelected ? ` ${styles.isSelected}` : ""}`}
              style={{ background: coloring.colorOf(psalm.number) }}
              onClick={() => {
                onSelect(psalm.number);
              }}
            />
          );
        })}
      </div>

      <ul className={styles.bookLegend} aria-label="Color legend">
        {coloring.legend.map((entry) => (
          <li key={entry.label}>
            <span className={styles.legendSwatch} style={{ background: entry.color }} />
            <span>{entry.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
