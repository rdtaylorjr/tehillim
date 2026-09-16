import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectControl } from "./SelectControl";

const OPTIONS = [
  { value: "all", label: "All" },
  { value: "word", label: "Word" },
] as const;

describe("SelectControl", () => {
  it("labels the select, so the control names what it sets", () => {
    render(
      <SelectControl label="Type" options={OPTIONS} value="all" onSelect={() => undefined} />,
    );
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
  });

  it("shows the value it was given", () => {
    render(
      <SelectControl label="Type" options={OPTIONS} value="word" onSelect={() => undefined} />,
    );
    expect(screen.getByLabelText<HTMLSelectElement>("Type").value).toBe("word");
  });

  it("reports the chosen value", () => {
    const onSelect = vi.fn();
    render(<SelectControl label="Type" options={OPTIONS} value="all" onSelect={onSelect} />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "word" } });
    expect(onSelect).toHaveBeenCalledWith("word");
  });

  it("ignores a value none of its options carries", () => {
    const onSelect = vi.fn();
    render(<SelectControl label="Type" options={OPTIONS} value="all" onSelect={onSelect} />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "mystery" } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("generates an id per instance, so two can share a page", () => {
    render(
      <>
        <SelectControl label="Type" options={OPTIONS} value="all" onSelect={() => undefined} />
        <SelectControl label="Text" options={OPTIONS} value="all" onSelect={() => undefined} />
      </>,
    );
    const type = screen.getByLabelText("Type");
    const text = screen.getByLabelText("Text");
    expect(type.id).not.toBe(text.id);
  });
});
