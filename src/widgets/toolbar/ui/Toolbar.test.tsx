import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar } from "./Toolbar";
import { INITIAL_SELECTION } from "../../../shared/lib/navigation";
import type { Selection } from "../../../shared/lib/navigation";

/** Cleans up first so a test may render several selections without duplicate matches. */
function renderToolbar(overrides: Partial<Selection> = {}): {
  dispatch: ReturnType<typeof vi.fn>;
} {
  cleanup();
  const dispatch = vi.fn();
  const selection = { ...INITIAL_SELECTION, ...overrides };
  render(<Toolbar selection={selection} dispatch={dispatch} />);
  return { dispatch };
}

const modelsGroup = (): HTMLElement => screen.getByRole("radiogroup", { name: "Models" });

/** The benchmark menu, since the model menu offers a Type of its own under the lexical family. */
const benchmarkMenu = (): HTMLElement => screen.getByLabelText("Benchmark");
const modelMenu = (): HTMLElement => screen.getByLabelText("Model");

describe("Toolbar model families", () => {
  it("offers every family, including those with no data", () => {
    renderToolbar();
    const names = within(modelsGroup())
      .getAllByRole("radio")
      .map((b) => b.textContent);
    expect(names).toEqual([
      "Phonological",
      "Morphological",
      "Lexical",
      "Syntactic",
      "Semantic",
    ]);
  });

  it("leaves families without data enabled, so their empty state can explain itself", () => {
    renderToolbar();
    expect(within(modelsGroup()).getByRole("radio", { name: "Phonological" })).toBeEnabled();
  });

  it("marks the selected family and dispatches when another is chosen", async () => {
    const { dispatch } = renderToolbar();
    expect(within(modelsGroup()).getByRole("radio", { name: "Semantic" })).toBeChecked();

    await userEvent.click(within(modelsGroup()).getByRole("radio", { name: "Lexical" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "family/selected", family: "lexical" });
  });
});

describe("Toolbar dependent filters", () => {
  it("shows Type under parallelism and Genre plus Metric under genre", () => {
    renderToolbar();
    expect(within(benchmarkMenu()).getByLabelText("Type")).toBeInTheDocument();
    expect(screen.queryByLabelText("Genre")).not.toBeInTheDocument();

    renderToolbar({ benchmark: "genre" });
    expect(screen.getByLabelText("Genre")).toBeInTheDocument();
    expect(screen.getByLabelText("Metric")).toBeInTheDocument();
  });

  it("shows Type for lexical and Level for syntactic, and neither for semantic", () => {
    renderToolbar({ family: "lexical" });
    expect(within(modelMenu()).getByLabelText("Type")).toBeInTheDocument();

    renderToolbar({ family: "syntactic" });
    expect(screen.getByLabelText("Level")).toBeInTheDocument();

    renderToolbar({ family: "morphological" });
    expect(within(modelMenu()).queryByLabelText("Type")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Level")).not.toBeInTheDocument();
  });

  it("shows Text for semantic always and for lexical only at the word type", () => {
    renderToolbar({ family: "semantic" });
    expect(screen.getByLabelText("Text")).toBeInTheDocument();

    renderToolbar({ family: "lexical", facet: "word" });
    expect(screen.getByLabelText("Text")).toBeInTheDocument();

    renderToolbar({ family: "lexical", facet: "homograph" });
    expect(screen.queryByLabelText("Text")).not.toBeInTheDocument();
  });

  it("offers a Control only once a trajectory metric is chosen, and dispatches it", async () => {
    renderToolbar({ benchmark: "genre" });
    expect(screen.queryByLabelText("Control")).not.toBeInTheDocument();

    const { dispatch } = renderToolbar({ benchmark: "genre", metric: "structural_distance" });
    expect(
      screen.getByRole("button", {
        name: "Genre / Structural Distance / Length",
      }),
    ).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByLabelText("Control"),
      "length_and_content_controlled",
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "control/selected",
      control: "length_and_content_controlled",
    });
  });

  it("dispatches genre and metric choices under the genre benchmark", async () => {
    const { dispatch } = renderToolbar({ benchmark: "genre" });

    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Lament");
    expect(dispatch).toHaveBeenCalledWith({ type: "genre/selected", genre: "Lament" });

    await userEvent.selectOptions(screen.getByLabelText("Metric"), "structural_distance");
    expect(dispatch).toHaveBeenCalledWith({
      type: "metric/selected",
      metric: "structural_distance",
    });
  });

  it("dispatches facet and text choices under a family that offers them", async () => {
    const { dispatch } = renderToolbar({ family: "lexical", facet: "word" });

    await userEvent.selectOptions(within(modelMenu()).getByLabelText("Type"), "lexeme");
    expect(dispatch).toHaveBeenCalledWith({ type: "facet/selected", facet: "lexeme" });

    await userEvent.selectOptions(screen.getByLabelText("Text"), "vocalized");
    expect(dispatch).toHaveBeenCalledWith({ type: "text/selected", text: "vocalized" });
  });

  it("dispatches the chosen value from a dependent select", async () => {
    const { dispatch } = renderToolbar();
    await userEvent.selectOptions(within(benchmarkMenu()).getByLabelText("Type"), "Staircase");
    expect(dispatch).toHaveBeenCalledWith({
      type: "parallelismType/selected",
      parallelismType: "Staircase",
    });
  });
});

describe("Toolbar path row", () => {
  it("dispatches typed queries from the filter field", async () => {
    const { dispatch } = renderToolbar();
    await userEvent.type(screen.getByLabelText("Filter"), "b");
    expect(dispatch).toHaveBeenCalledWith({ type: "query/changed", query: "b" });
  });

  it("gives each choice its own control, each naming what is chosen", () => {
    //: Two choices, so two dropdowns, each legible with its menu shut.
    renderToolbar();
    expect(screen.getByRole("button", { name: "Semantic" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Parallelism" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("carries the narrowing filters into the toggle that owns them", () => {
    renderToolbar({ family: "lexical", facet: "word", text: "consonantal" });
    expect(
      screen.getByRole("button", { name: "Lexical / Word / Consonantal" }),
    ).toBeInTheDocument();
  });
});

describe("Toolbar detail state", () => {
  it("hides the filter box, which only ever narrowed the table", () => {
    renderToolbar({ model: "bge_m3_vocalized", view: "detail" });
    expect(screen.queryByLabelText("Filter")).not.toBeInTheDocument();
  });

  it("ends the path with the open model", () => {
    renderToolbar({ model: "bge_m3_vocalized", view: "detail" });
    expect(screen.getByText("bge_m3_vocalized")).toBeInTheDocument();
  });

  it("returns to the table from the View switch, with no separate way back", async () => {
    const { dispatch } = renderToolbar({ model: "bge_m3_vocalized", view: "detail" });
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Table" }));
    expect(dispatch).toHaveBeenCalledWith({ type: "model/selected", model: null });
  });

  it("drops the fold control, since there is nothing left to fold", () => {
    renderToolbar({ model: "bge_m3_vocalized", view: "detail" });
    expect(screen.queryByRole("button", { name: /toggle the model/i })).not.toBeInTheDocument();
  });

  it("leaves the path inert rather than advertising a click that does nothing", async () => {
    const { dispatch } = renderToolbar({ model: "bge_m3_vocalized", view: "detail" });
    await userEvent.click(screen.getByText("bge_m3_vocalized"));
    expect(dispatch).not.toHaveBeenCalled();
  });
});
