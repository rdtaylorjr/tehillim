import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ModelDropdown } from "./ModelDropdown";
import { MODEL_FAMILIES } from "../../../shared/lib/corpus";
import { INITIAL_SELECTION } from "../../../shared/lib/navigation";

const lexical = { ...INITIAL_SELECTION, family: "lexical" as const, model: "lexeme_icf" };

describe("ModelDropdown", () => {
  it("offers only the families it is given, in the order given", () => {
    render(
      <ModelDropdown
        selection={lexical}
        dispatch={vi.fn()}
        families={MODEL_FAMILIES.filter((f) => f.id !== "phonological")}
      />,
    );
    const names = within(screen.getByRole("radiogroup", { name: "Models" }))
      .getAllByRole("radio")
      .map((b) => b.textContent);
    expect(names).toEqual(["Morphological", "Lexical", "Syntactic", "Semantic"]);
  });

  it("names the axes chosen above the model before it on the toggle", () => {
    render(
      <ModelDropdown
        selection={lexical}
        dispatch={vi.fn()}
        models={[{ value: "lexeme_icf", label: "lexeme_icf" }]}
        axes={["Mean Pool"]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Lexical / Mean Pool / lexeme_icf" }),
    ).toBeInTheDocument();
  });
});
