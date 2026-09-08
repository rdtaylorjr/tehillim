import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dropdown, DropdownPills, DropdownRow } from "./Dropdown";

function setup(): { toggle: () => HTMLElement; menu: () => HTMLElement } {
  render(
    <Dropdown label="Model" current="Semantic / AlephBERT">
      <DropdownRow>
        <DropdownPills>
          <button type="button">Semantic</button>
        </DropdownPills>
      </DropdownRow>
      <DropdownRow label="Encoder">
        <select aria-label="Encoder">
          <option value="alephbert">AlephBERT</option>
        </select>
      </DropdownRow>
    </Dropdown>,
  );
  return {
    toggle: () => screen.getByRole("button", { name: "Semantic / AlephBERT" }),
    menu: () => screen.getByLabelText("Model"),
  };
}

describe("Dropdown", () => {
  it("names what is chosen on the toggle, so the choice reads with the menu shut", () => {
    const { toggle } = setup();
    expect(toggle()).toHaveTextContent("Semantic / AlephBERT");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("labels the control beside the toggle", () => {
    setup();
    expect(screen.getByText("Model")).toBeInTheDocument();
  });

  it("opens on the toggle and closes on a second click", () => {
    const { toggle } = setup();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape", () => {
    const { toggle } = setup();
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores a key that is not Escape", () => {
    const { toggle } = setup();
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: "Enter" });
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on a click outside and stays open on one inside", () => {
    const { toggle, menu } = setup();
    fireEvent.click(toggle());
    fireEvent.click(menu());
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(document.body);
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("stops listening once unmounted", () => {
    const { toggle } = setup();
    fireEvent.click(toggle());
    screen.getByRole("button", { name: "Semantic / AlephBERT" }).remove();
    expect(() => {
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.click(document.body);
    }).not.toThrow();
  });

  it("labels a row that names its axis and leaves a self-naming one bare", () => {
    setup();
    expect(screen.getByText("Encoder")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Encoder" })).toBeInTheDocument();
  });
});
