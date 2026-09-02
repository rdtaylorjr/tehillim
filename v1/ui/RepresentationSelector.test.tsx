import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RepresentationSelector } from "./RepresentationSelector";

const LEXICAL_SYNTACTIC_IDS = [
  "lexical-tfidf-cosine",
  "named-entity-identity-tfidf-cosine",
  "clause-type-tfidf-cosine",
];

const SEMANTIC_IDS = [
  "miqrabert-mean-pool-tfidf-cosine",
  "miqrabert-soft-alignment-tfidf-cosine",
  "alephbert-mean-pool-tfidf-cosine",
  "alephbert-soft-alignment-tfidf-cosine",
  "alephbert-soft-alignment-top-pc-tfidf-cosine",
  "alephbert-soft-alignment-whitened-tfidf-cosine",
  "bge-m3-mean-pool-tfidf-cosine",
  "bge-m3-mean-pool-consonantal-tfidf-cosine",
  "bge-m3-mean-pool-vocalized-tfidf-cosine",
  "bge-m3-soft-alignment-tfidf-cosine",
  "bge-m3-soft-alignment-consonantal-tfidf-cosine",
  "bge-m3-soft-alignment-vocalized-tfidf-cosine",
  "openai-mean-pool-tfidf-cosine",
  "openai-mean-pool-consonantal-tfidf-cosine",
  "openai-mean-pool-vocalized-tfidf-cosine",
  "openai-soft-alignment-tfidf-cosine",
  "openai-soft-alignment-consonantal-tfidf-cosine",
  "openai-soft-alignment-vocalized-tfidf-cosine",
];

const ALL_IDS = [...LEXICAL_SYNTACTIC_IDS, ...SEMANTIC_IDS];

/** Class names come back unscoped in tests - as the stylesheet's own keys - so
 * these read that vocabulary the way the v1 suite read its class names. */
function setup(
  availableIds: string[],
  initialId: string,
  onChange = vi.fn(),
): {
  view: ReturnType<typeof render>;
  toggle: HTMLButtonElement;
  panel: HTMLDivElement;
  onChange: ReturnType<typeof vi.fn>;
} {
  const view = render(
    <RepresentationSelector
      availableIds={availableIds}
      value={initialId}
      onChange={onChange}
    />,
  );
  const container = view.container;
  const toggle = container.querySelector<HTMLButtonElement>(".representationToggle")!;
  const panel = container.querySelector<HTMLDivElement>(".representationPanel")!;
  return { view, toggle, panel, onChange };
}

const typeRowOf = (panel: HTMLElement): HTMLElement =>
  panel.querySelector(".representationTypeChip")!.closest(".representationRow")!;

const rowByLabel = (panel: HTMLElement, label: string): HTMLElement | undefined =>
  [...panel.querySelectorAll<HTMLElement>(".representationRow")].find(
    (row) => row.querySelector(".representationRowLabel")?.textContent === label,
  );

const chipLabels = (row: HTMLElement): (string | null)[] =>
  [...row.querySelectorAll<HTMLButtonElement>("button")].map((b) => b.textContent);

const activeChipLabel = (row: HTMLElement): string | undefined =>
  row.querySelector<HTMLElement>(".isActive")?.textContent ?? undefined;

const clickChip = (row: HTMLElement, label: string): void => {
  const chip = [...row.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent === label,
  )!;
  fireEvent.click(chip);
};

const selectOf = (row: HTMLElement): HTMLSelectElement => row.querySelector("select")!;

const selectOptionValues = (row: HTMLElement): string[] =>
  [...selectOf(row).options].map((o) => o.value);

const chooseOption = (row: HTMLElement, value: string): void => {
  fireEvent.change(selectOf(row), { target: { value } });
};

const isOpen = (panel: HTMLElement): boolean => panel.classList.contains("isOpen");

afterEach(() => {
  vi.useRealTimers();
});

describe("RepresentationSelector: initialization", () => {
  it("selects the initial id's Type and Method, with a matching toggle label", () => {
    const { toggle, panel } = setup(ALL_IDS, "clause-type-tfidf-cosine");
    expect(toggle.textContent).toBe("Syntactic (Clause Type)");
    expect(activeChipLabel(typeRowOf(panel))).toBe("Syntactic");
    expect(selectOf(rowByLabel(panel, "Method")!).value).toBe("clause-type");
  });

  it("parses a semantic id into Encoder/Aggregation/Correction, with no Text row for a consonantal-only encoder", () => {
    const { toggle, panel } = setup(ALL_IDS, "alephbert-soft-alignment-top-pc-tfidf-cosine");
    expect(toggle.textContent).toBe("Semantic (AlephBERT, Soft-Alignment, Top-PC Removed)");
    expect(activeChipLabel(typeRowOf(panel))).toBe("Semantic");
    expect(selectOf(rowByLabel(panel, "Encoder")!).value).toBe("alephbert");
    expect(activeChipLabel(rowByLabel(panel, "Aggregation")!)).toBe("Soft-Alignment");
    expect(activeChipLabel(rowByLabel(panel, "Correction")!)).toBe("Top-PC removed");
    expect(rowByLabel(panel, "Text")).toBeUndefined();
  });

  it("parses a multilingual encoder's vocalized id into the Text row", () => {
    const { toggle, panel } = setup(ALL_IDS, "bge-m3-soft-alignment-vocalized-tfidf-cosine");
    expect(toggle.textContent).toBe("Semantic (BGE-M3, Soft-Alignment, Vocalized)");
    expect(activeChipLabel(rowByLabel(panel, "Text")!)).toBe("Vocalized");
    expect(rowByLabel(panel, "Correction")).toBeUndefined();
  });

  it("falls back to the first available type when the initial id's type has no backing data", () => {
    const { panel } = setup(SEMANTIC_IDS, "lexical-tfidf-cosine");
    expect(activeChipLabel(typeRowOf(panel))).toBe("Semantic");
  });

  it("falls back to Lexical defaults for a completely unrecognized initial id", () => {
    const { toggle, panel } = setup(ALL_IDS, "mystery-method-tfidf-cosine");
    expect(activeChipLabel(typeRowOf(panel))).toBe("Lexical");
    expect(toggle.textContent).toBe("Lexical");
    expect(selectOf(rowByLabel(panel, "Method")!).value).toBe("lexical");
  });

  it("reports the id it actually resolved on mount, so label and data cannot disagree", () => {
    // An id the catalog cannot represent falls back to Lexical. Emitting that
    // resolution is what stops the toggle reading "Lexical" while the page is
    // still showing the unrepresentable method.
    const { onChange } = setup(ALL_IDS, "mystery-method-tfidf-cosine");
    expect(onChange).toHaveBeenLastCalledWith("lexical-tfidf-cosine");
  });

  it("opens closed", () => {
    const { panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    expect(isOpen(panel)).toBe(false);
  });
});

describe("RepresentationSelector: availability filtering", () => {
  it("omits a Type chip entirely when that type has no backing data", () => {
    const { panel } = setup(SEMANTIC_IDS, "alephbert-mean-pool-tfidf-cosine");
    expect(chipLabels(typeRowOf(panel))).toEqual(["Semantic"]);
  });

  it("filters the Method dropdown to only methods present in availableIds", () => {
    const { panel } = setup(LEXICAL_SYNTACTIC_IDS, "lexical-tfidf-cosine");
    expect(selectOptionValues(rowByLabel(panel, "Method")!)).toEqual([
      "lexical",
      "named-entity-identity",
    ]);
  });

  it("filters the Encoder dropdown to only encoders present, in the declared order", () => {
    const { panel } = setup(SEMANTIC_IDS, "alephbert-mean-pool-tfidf-cosine");
    expect(selectOptionValues(rowByLabel(panel, "Encoder")!)).toEqual([
      "miqrabert",
      "alephbert",
      "openai",
      "bge-m3",
    ]);
  });

  it("hides the Correction row on Mean-Pool even for an encoder with Soft-Alignment correction data", () => {
    const { panel } = setup(SEMANTIC_IDS, "alephbert-mean-pool-tfidf-cosine");
    expect(rowByLabel(panel, "Correction")).toBeUndefined();
  });

  it("hides the Correction row entirely for an encoder with no correction data, even on Soft-Alignment", () => {
    const { panel } = setup(SEMANTIC_IDS, "miqrabert-soft-alignment-tfidf-cosine");
    expect(rowByLabel(panel, "Correction")).toBeUndefined();
  });

  it("shows the Correction row, in Top-PC/Whitened/None order, once Soft-Alignment is active for a supporting encoder", () => {
    const { panel } = setup(SEMANTIC_IDS, "alephbert-soft-alignment-tfidf-cosine");
    expect(chipLabels(rowByLabel(panel, "Correction")!)).toEqual([
      "Top-PC removed",
      "Whitened",
      "None",
    ]);
  });
});

describe("RepresentationSelector: interaction and state persistence", () => {
  it("switching Type re-renders the Method row and emits the new resolved id", () => {
    const { panel, onChange } = setup(ALL_IDS, "lexical-tfidf-cosine");
    clickChip(typeRowOf(panel), "Syntactic");
    expect(selectOf(rowByLabel(panel, "Method")!).value).toBe("clause-type");
    expect(onChange).toHaveBeenLastCalledWith("clause-type-tfidf-cosine");
  });

  it("persists a Text pick across a switch between two text-supporting encoders", () => {
    const { panel } = setup(ALL_IDS, "bge-m3-mean-pool-tfidf-cosine");
    clickChip(rowByLabel(panel, "Text")!, "Vocalized");
    chooseOption(rowByLabel(panel, "Encoder")!, "openai");
    expect(activeChipLabel(rowByLabel(panel, "Text")!)).toBe("Vocalized");
  });

  it("resets Text to Consonantal after passing through an encoder with no Text axis", () => {
    const { panel } = setup(ALL_IDS, "bge-m3-mean-pool-tfidf-cosine");
    clickChip(rowByLabel(panel, "Text")!, "Vocalized");
    chooseOption(rowByLabel(panel, "Encoder")!, "alephbert");
    chooseOption(rowByLabel(panel, "Encoder")!, "openai");
    expect(activeChipLabel(rowByLabel(panel, "Text")!)).toBe("Consonantal");
  });

  it("defaults Correction to Top-PC removed, not None, the first time Soft-Alignment is enabled", () => {
    const ids = [
      "lexical-tfidf-cosine",
      ...SEMANTIC_IDS.filter((id) => id.startsWith("alephbert-")),
    ];
    const { panel } = setup(ids, "lexical-tfidf-cosine");
    clickChip(typeRowOf(panel), "Semantic");
    clickChip(rowByLabel(panel, "Aggregation")!, "Soft-Alignment");
    expect(activeChipLabel(rowByLabel(panel, "Correction")!)).toBe("Top-PC removed");
  });

  it("marks the active chip as pressed for assistive technology", () => {
    const { panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    const chips = [...typeRowOf(panel).querySelectorAll("button")];
    const pressed = chips.filter((c) => c.getAttribute("aria-pressed") === "true");
    expect(pressed.map((c) => c.textContent)).toEqual(["Lexical"]);
  });
});

describe("RepresentationSelector: panel open/close", () => {
  it("opens on toggle click and closes on a second toggle click", () => {
    const { toggle, panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    expect(isOpen(panel)).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(isOpen(panel)).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on an outside click", () => {
    const { toggle, panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    fireEvent.click(document.body);
    expect(isOpen(panel)).toBe(false);
  });

  it("stays open on a click inside the panel", () => {
    const { toggle, panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    fireEvent.click(panel);
    expect(isOpen(panel)).toBe(true);
  });

  it("closes on Escape", () => {
    const { toggle, panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(isOpen(panel)).toBe(false);
  });
});

describe("RepresentationSelector: auto-close timing", () => {
  it("does not start a close countdown merely from opening the panel", () => {
    vi.useFakeTimers();
    const { toggle, panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(isOpen(panel)).toBe(true);
  });

  it("auto-closes 10s after a pick", () => {
    vi.useFakeTimers();
    const { toggle, panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    clickChip(typeRowOf(panel), "Semantic");
    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(isOpen(panel)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(isOpen(panel)).toBe(false);
  });

  it("pauses the countdown while a select has focus, and resumes it on blur", () => {
    vi.useFakeTimers();
    const { toggle, panel } = setup(ALL_IDS, "alephbert-mean-pool-tfidf-cosine");
    fireEvent.click(toggle);
    clickChip(rowByLabel(panel, "Aggregation")!, "Soft-Alignment");
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    const select = selectOf(rowByLabel(panel, "Encoder")!);
    fireEvent.focus(select);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(isOpen(panel)).toBe(true);
    fireEvent.blur(select);
    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(isOpen(panel)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(isOpen(panel)).toBe(false);
  });

  it("lets several picks combine in one visit rather than closing on the first", () => {
    vi.useFakeTimers();
    const { toggle, panel } = setup(ALL_IDS, "bge-m3-mean-pool-tfidf-cosine");
    fireEvent.click(toggle);
    clickChip(rowByLabel(panel, "Text")!, "Vocalized");
    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    clickChip(rowByLabel(panel, "Aggregation")!, "Soft-Alignment");
    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    expect(isOpen(panel)).toBe(true);
  });

  it("drops a pending countdown on unmount rather than firing into a gone component", () => {
    vi.useFakeTimers();
    const { view, toggle, panel } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    clickChip(typeRowOf(panel), "Semantic");
    view.unmount();
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
    }).not.toThrow();
  });
});

describe("RepresentationSelector: unmount", () => {
  it("stops reacting to outside clicks and Escape once unmounted", () => {
    const { view, toggle } = setup(ALL_IDS, "lexical-tfidf-cosine");
    fireEvent.click(toggle);
    view.unmount();
    expect(() => {
      fireEvent.click(document.body);
      fireEvent.keyDown(document, { key: "Escape" });
    }).not.toThrow();
  });
});

describe("RepresentationSelector: id resolution and suffix", () => {
  it("uses the -spectral suffix on the Cluster page's id shape", () => {
    const clusterIds = ALL_IDS.map((id) => id.replace("-tfidf-cosine", "-spectral"));
    const { panel, onChange } = setup(clusterIds, "lexical-spectral");
    clickChip(typeRowOf(panel), "Syntactic");
    expect(onChange).toHaveBeenLastCalledWith("clause-type-spectral");
  });

  it("falls back to a synthesized id when the selected axis combination has no backing data", () => {
    const sparseIds = [
      "lexical-tfidf-cosine",
      "bge-m3-mean-pool-tfidf-cosine",
      "bge-m3-mean-pool-consonantal-tfidf-cosine",
    ];
    const { panel, onChange } = setup(sparseIds, "bge-m3-mean-pool-consonantal-tfidf-cosine");
    clickChip(rowByLabel(panel, "Aggregation")!, "Soft-Alignment");
    expect(onChange).toHaveBeenLastCalledWith("bge-m3-soft-alignment-consonantal-tfidf-cosine");
  });
});
