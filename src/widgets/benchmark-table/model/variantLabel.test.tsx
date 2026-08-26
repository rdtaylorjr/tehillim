import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { hasVariantTag, variantLabel } from "./variantLabel";

describe("variantLabel", () => {
  it("appends a variant tag when a real text variant is present", () => {
    render(
      <div data-testid="cell">
        {variantLabel({ model_base: "alephbert", text_variant: "consonantal" })}
      </div>,
    );
    expect(screen.getByTestId("cell")).toHaveTextContent("alephbert consonantal");
    expect(screen.getByText("consonantal")).toHaveClass("variantTag");
  });

  it("leaves the name bare when the variant is unknown", () => {
    render(
      <div data-testid="cell">
        {variantLabel({ model_base: "sbert", text_variant: "unknown" })}
      </div>,
    );
    expect(screen.getByTestId("cell")).toHaveTextContent("sbert");
    expect(screen.queryByText("unknown")).not.toBeInTheDocument();
  });

  it("leaves the name bare when no variant is given at all", () => {
    render(<div data-testid="cell">{variantLabel({ model_base: "sbert" })}</div>);
    expect(screen.getByTestId("cell")).toHaveTextContent("sbert");
  });

  it("reports whether a row carries a real variant", () => {
    expect(hasVariantTag({ text_variant: "vocalized" })).toBe(true);
    expect(hasVariantTag({ text_variant: "unknown" })).toBe(false);
    expect(hasVariantTag({})).toBe(false);
  });
});
