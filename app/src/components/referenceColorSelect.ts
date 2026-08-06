import { requireEl } from "../lib/dom";
import type { ReferenceColorMode } from "../lib/referenceColor";

//: Static, page-independent options - unlike the method selects (whose
//: options come from fetched data), this dropdown's choices never vary,
//: so the whole thing is genuinely identical on both pages and safe to
//: share outright rather than duplicate.
const OPTIONS: { value: ReferenceColorMode; label: string }[] = [
  { value: "book", label: "Books" },
  { value: "family", label: "Gunkel Genres (6)" },
  { value: "genre", label: "Gunkel Genres (14)" },
];

/** Wires the one shared "what does color mean" dropdown that lives in the
 * picker panel on both pages - see lib/referenceColor.ts. */
export function setupReferenceColorSelect(
  initialMode: ReferenceColorMode,
  onChange: (mode: ReferenceColorMode) => void,
): void {
  const select = requireEl<HTMLSelectElement>("#reference-color-select");
  select.innerHTML = "";
  for (const { value, label } of OPTIONS) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  }
  select.value = initialMode;
  select.addEventListener("change", () => onChange(select.value as ReferenceColorMode));
}
