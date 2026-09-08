import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

function setup(
  availableIds: string[],
  initialId: string,
  onChange = vi.fn(),
): { onChange: ReturnType<typeof vi.fn> } {
  render(
    <RepresentationSelector
      availableIds={availableIds}
      value={initialId}
      onChange={onChange}
    />,
  );
  return { onChange };
}

/** The families, as the same pill radiogroup the benchmark toolbar uses. */
const families = (): HTMLElement => screen.getByRole("radiogroup", { name: "Models" });

const familyLabels = (): (string | null)[] =>
  within(families())
    .getAllByRole("radio")
    .map((pill) => pill.textContent);

const activeFamily = (): string | null | undefined =>
  within(families())
    .getAllByRole("radio")
    .find((pill) => pill.getAttribute("aria-checked") === "true")?.textContent;

const pickFamily = (label: string): void => {
  fireEvent.click(within(families()).getByRole("radio", { name: label }));
};

/** An axis, as the same labelled select the benchmark toolbar's rail uses. */
const axis = (label: string): HTMLSelectElement | null =>
  screen.queryByLabelText<HTMLSelectElement>(label);

const axisValues = (label: string): string[] =>
  [...screen.getByLabelText<HTMLSelectElement>(label).options].map((o) => o.value);

const axisOptionLabels = (label: string): string[] =>
  [...screen.getByLabelText<HTMLSelectElement>(label).options].map((o) => o.text);

const chooseAxis = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

describe("RepresentationSelector: the dropdown", () => {
  const toggle = (): HTMLElement =>
    screen.getByRole("button", { name: /Semantic|Lexical|Syntactic/ });

  it("names what is chosen on the toggle, so the choice reads with the menu shut", () => {
    setup(ALL_IDS, "alephbert-mean-pool-tfidf-cosine");
    expect(toggle()).toHaveTextContent("Semantic / AlephBERT / Mean-Pool");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on the toggle and closes on a second click", () => {
    setup(ALL_IDS, "alephbert-mean-pool-tfidf-cosine");
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and on a click outside", () => {
    setup(ALL_IDS, "alephbert-mean-pool-tfidf-cosine");
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle());
    fireEvent.click(document.body);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("names the families as pills, in canonical order", () => {
    setup(ALL_IDS, "lexical-tfidf-cosine");
    expect(familyLabels()).toEqual(["Lexical", "Syntactic", "Semantic"]);
  });

  it("omits a family entirely when it has no backing data", () => {
    setup(SEMANTIC_IDS, "alephbert-mean-pool-tfidf-cosine");
    expect(familyLabels()).toEqual(["Semantic"]);
  });
});

describe("RepresentationSelector: initialization", () => {
  it("selects the initial id's family and method", () => {
    setup(ALL_IDS, "clause-type-tfidf-cosine");
    expect(activeFamily()).toBe("Syntactic");
    expect(axis("Method")?.value).toBe("clause-type");
  });

  it("parses a semantic id into Encoder/Aggregation/Correction, with no Text axis for a consonantal-only encoder", () => {
    setup(ALL_IDS, "alephbert-soft-alignment-top-pc-tfidf-cosine");
    expect(activeFamily()).toBe("Semantic");
    expect(axis("Encoder")?.value).toBe("alephbert");
    expect(axis("Aggregation")?.value).toBe("Soft-Alignment");
    expect(axis("Correction")?.value).toBe("Top-PC removed");
    expect(axis("Text")).toBeNull();
  });

  it("parses a multilingual encoder's vocalized id into the Text axis", () => {
    setup(ALL_IDS, "bge-m3-soft-alignment-vocalized-tfidf-cosine");
    expect(axis("Text")?.value).toBe("Vocalized");
    expect(axis("Correction")).toBeNull();
  });

  it("falls back to the first available family when the initial id's has no backing data", () => {
    setup(SEMANTIC_IDS, "lexical-tfidf-cosine");
    expect(activeFamily()).toBe("Semantic");
  });

  it("falls back to Lexical for a completely unrecognized initial id", () => {
    setup(ALL_IDS, "mystery-method-tfidf-cosine");
    expect(activeFamily()).toBe("Lexical");
    expect(axis("Method")?.value).toBe("lexical");
  });

  it("reports the id it actually resolved on mount, so label and data cannot disagree", () => {
    const { onChange } = setup(ALL_IDS, "mystery-method-tfidf-cosine");
    expect(onChange).toHaveBeenLastCalledWith("lexical-tfidf-cosine");
  });
});

describe("RepresentationSelector: availability filtering", () => {
  it("filters the Method axis to only methods present in availableIds", () => {
    setup(LEXICAL_SYNTACTIC_IDS, "lexical-tfidf-cosine");
    expect(axisValues("Method")).toEqual(["lexical", "named-entity-identity"]);
  });

  it("filters the Encoder axis to only encoders present, in the declared order", () => {
    setup(SEMANTIC_IDS, "alephbert-mean-pool-tfidf-cosine");
    expect(axisValues("Encoder")).toEqual(["miqrabert", "alephbert", "openai", "bge-m3"]);
  });

  it("hides the Correction axis on Mean-Pool even for an encoder with correction data", () => {
    setup(SEMANTIC_IDS, "alephbert-mean-pool-tfidf-cosine");
    expect(axis("Correction")).toBeNull();
  });

  it("hides the Correction axis entirely for an encoder with no correction data", () => {
    setup(SEMANTIC_IDS, "miqrabert-soft-alignment-tfidf-cosine");
    expect(axis("Correction")).toBeNull();
  });

  it("shows the Correction axis, in Top-PC/Whitened/None order, once Soft-Alignment is active", () => {
    setup(SEMANTIC_IDS, "alephbert-soft-alignment-tfidf-cosine");
    expect(axisValues("Correction")).toEqual(["Top-PC removed", "Whitened", "None"]);
  });

  it("settles an axis the payload varies only one way rather than offering a dead pick", () => {
    //: Every control asks a question the data can answer, so no pick is dead.
    setup(
      [
        "lexical-tfidf-cosine",
        "bge-m3-mean-pool-tfidf-cosine",
        "bge-m3-mean-pool-consonantal-tfidf-cosine",
      ],
      "bge-m3-mean-pool-consonantal-tfidf-cosine",
    );
    expect(axis("Aggregation")).toBeNull();
    expect(axis("Text")?.value).toBe("Consonantal");
  });
});

describe("RepresentationSelector: interaction and state persistence", () => {
  it("switching family re-renders its axes and emits the new resolved id", () => {
    const { onChange } = setup(ALL_IDS, "lexical-tfidf-cosine");
    pickFamily("Syntactic");
    expect(axis("Method")?.value).toBe("clause-type");
    expect(onChange).toHaveBeenLastCalledWith("clause-type-tfidf-cosine");
  });

  it("persists a Text pick across a switch between two text-supporting encoders", () => {
    setup(ALL_IDS, "bge-m3-mean-pool-tfidf-cosine");
    chooseAxis("Text", "Vocalized");
    chooseAxis("Encoder", "openai");
    expect(axis("Text")?.value).toBe("Vocalized");
  });

  it("resets Text to Consonantal after passing through an encoder with no Text axis", () => {
    setup(ALL_IDS, "bge-m3-mean-pool-tfidf-cosine");
    chooseAxis("Text", "Vocalized");
    chooseAxis("Encoder", "alephbert");
    chooseAxis("Encoder", "openai");
    expect(axis("Text")?.value).toBe("Consonantal");
  });

  it("defaults Correction to Top-PC removed, not None, the first time Soft-Alignment is chosen", () => {
    setup(
      ["lexical-tfidf-cosine", ...SEMANTIC_IDS.filter((id) => id.startsWith("alephbert-"))],
      "lexical-tfidf-cosine",
    );
    pickFamily("Semantic");
    chooseAxis("Aggregation", "Soft-Alignment");
    expect(axis("Correction")?.value).toBe("Top-PC removed");
  });

  it("marks the chosen family checked for assistive technology", () => {
    setup(ALL_IDS, "lexical-tfidf-cosine");
    expect(activeFamily()).toBe("Lexical");
  });
});

describe("RepresentationSelector: signals the naming table has not caught up with", () => {
  //: These guard the failure where hardcoded lists hid eighty semantic methods.
  const NEW_ENCODER_IDS = [
    "bge-m3-mean-pool-tfidf-cosine",
    "f2llm-v2-14b-mean-pool-tfidf-cosine",
    "f2llm-v2-14b-mean-pool-consonantal-tfidf-cosine",
    "f2llm-v2-14b-soft-alignment-tfidf-cosine",
  ];

  it("offers an encoder no naming table lists, under its own id", () => {
    setup(NEW_ENCODER_IDS, "bge-m3-mean-pool-tfidf-cosine");
    expect(axisValues("Encoder")).toEqual(["bge-m3", "f2llm-v2-14b"]);
    expect(axisOptionLabels("Encoder")).toEqual(["BGE-M3", "f2llm-v2-14b"]);
  });

  it("gives an unnamed encoder every axis its ids carry", () => {
    setup(NEW_ENCODER_IDS, "f2llm-v2-14b-mean-pool-tfidf-cosine");
    expect(axisValues("Text")).toEqual(["Consonantal", "Cantillation"]);
    expect(axisValues("Aggregation")).toEqual(["Mean-Pool", "Soft-Alignment"]);
  });

  it("files a signal outside the naming table under Other rather than dropping it", () => {
    const { onChange } = setup(
      ["lexical-tfidf-cosine", "word-consonantal-icf-tfidf-cosine"],
      "lexical-tfidf-cosine",
    );
    expect(familyLabels()).toEqual(["Lexical", "Other"]);
    pickFamily("Other");
    expect(axisValues("Method")).toEqual(["word-consonantal-icf"]);
    expect(onChange).toHaveBeenLastCalledWith("word-consonantal-icf-tfidf-cosine");
  });
});

describe("RepresentationSelector: id resolution and suffix", () => {
  it("uses the -spectral suffix on the Cluster page's id shape", () => {
    const { onChange } = setup(
      ALL_IDS.map((id) => id.replace("-tfidf-cosine", "-spectral")),
      "lexical-spectral",
    );
    pickFamily("Syntactic");
    expect(onChange).toHaveBeenLastCalledWith("clause-type-spectral");
  });
});
