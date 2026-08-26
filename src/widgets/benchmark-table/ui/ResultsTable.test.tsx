import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsTable } from "./ResultsTable";
import { ciPill } from "../../../shared/ui/Pill";
import type { TableColumn } from "../../../shared/lib/results";

interface Row {
  model: string;
  model_base: string;
  text_variant: string;
  separation_auc: number;
  separation_p_q: number;
  scope: string;
}

const ROWS: Row[] = [
  {
    model: "alephbert_consonantal",
    model_base: "alephbert",
    text_variant: "consonantal",
    separation_auc: 0.689,
    separation_p_q: 0.004,
    scope: "Antithetic",
  },
  {
    model: "sbert_unknown",
    model_base: "sbert",
    text_variant: "unknown",
    separation_auc: 0.912,
    separation_p_q: 0.2,
    scope: "Synonymous",
  },
];

const COLUMNS: TableColumn<Row>[] = [
  { key: "model_base", label: "Name", type: "text" },
  { key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 },
  { key: "separation_p_q", label: "Sig (FDR q)", type: "pill", pillPrefix: "q" },
  { key: "scope", label: "Type", type: "text" },
];

function renderTable(over: Partial<React.ComponentProps<typeof ResultsTable<Row>>> = {}): {
  onSort: ReturnType<typeof vi.fn>;
  onOpenModel: ReturnType<typeof vi.fn>;
} {
  cleanup();
  const onSort = vi.fn();
  const onOpenModel = vi.fn();
  render(
    <ResultsTable
      caption="Semantic × Parallelism: 2 rows"
      rows={ROWS}
      columns={COLUMNS}
      sortKey="separation_auc"
      sortDir="desc"
      onSort={onSort}
      onOpenModel={onOpenModel}
      {...over}
    />,
  );
  return { onSort, onOpenModel };
}

const bodyRows = (): HTMLElement[] => screen.getAllByRole("row").slice(1);

describe("ResultsTable", () => {
  it("heads each column with its label", () => {
    renderTable();
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Name",
      "Separation AUC",
      "Sig (FDR q)",
      "Type",
    ]);
  });

  it("sorts the rows by the given key and direction", () => {
    renderTable();
    expect(bodyRows()[0]).toHaveTextContent("sbert");

    renderTable({ sortDir: "asc" });
    expect(bodyRows()[0]).toHaveTextContent("alephbert");
  });

  it("marks the sorted column, in the direction it is sorted", () => {
    renderTable();
    const header = screen.getByRole("columnheader", { name: "Separation AUC" });
    expect(header).toHaveClass("sortedDesc");
    expect(header).toHaveAttribute("aria-sort", "descending");

    renderTable({ sortDir: "asc" });
    expect(screen.getByRole("columnheader", { name: "Separation AUC" })).toHaveClass(
      "sortedAsc",
    );
  });

  it("leaves unsorted columns unmarked", () => {
    renderTable();
    expect(screen.getByRole("columnheader", { name: "Name" })).not.toHaveAttribute("aria-sort");
  });

  it("asks for a new sort when a header is clicked", async () => {
    const { onSort } = renderTable();
    await userEvent.click(screen.getByRole("button", { name: "Sig (FDR q)" }));
    expect(onSort).toHaveBeenCalledWith("separation_p_q");
  });

  it("formats numeric cells to the column's digits", () => {
    renderTable();
    expect(within(bodyRows()[1]!).getByText("0.6890")).toBeInTheDocument();
  });

  it("renders pill cells through the significance pill", () => {
    renderTable();
    const pill = bodyRows()[1]!.querySelector(".pill");
    expect(pill).toHaveTextContent("q=0.0040");
    expect(pill).toHaveClass("good");
  });

  it("gives numeric and pill cells the num class, and the name cell the model class", () => {
    renderTable();
    const cells = within(bodyRows()[0]!).getAllByRole("cell");
    expect(cells[0]).toHaveClass("modelCell");
    expect(cells[1]).toHaveClass("num");
    expect(cells[2]).toHaveClass("num");
    expect(cells[3]).not.toHaveClass("num");
    expect(cells[3]).not.toHaveClass("modelCell");
  });

  it("opens the model when its name is clicked", async () => {
    const { onOpenModel } = renderTable();
    await userEvent.click(screen.getByRole("button", { name: "alephbert" }));
    expect(onOpenModel).toHaveBeenCalledWith("alephbert_consonantal");
  });

  it("uses a column's own renderer when it has one", () => {
    renderTable({
      columns: [
        { key: "model_base", label: "Name", type: "text" },
        {
          key: "auc_ci",
          label: "AUC 95% CI",
          type: "pill",
          render: () => ciPill(0.55, 0.65, 0.5),
        },
      ],
    });
    expect(screen.getAllByText("[0.5500, 0.6500]").length).toBe(2);
  });

  it("keeps rows distinct when one model repeats across sources", () => {
    const repeated = [
      { model: "voyage_4", source: "raw", gap: 0.003 },
      { model: "voyage_4", source: "length_controlled", gap: 0.002 },
      { model: "voyage_4", source: "length_and_content_controlled", gap: 0.001 },
    ] as unknown as Row[];
    renderTable({
      rows: repeated,
      columns: [
        { key: "model", label: "Name", type: "text" },
        { key: "source", label: "Source", type: "text" },
        { key: "gap", label: "Gap", type: "num", digits: 5 },
      ],
      sortKey: "gap",
    });
    expect(bodyRows()).toHaveLength(3);
    expect(bodyRows().map((r) => r.textContent)).toEqual([
      "voyage_4raw0.00300",
      "voyage_4length_controlled0.00200",
      "voyage_4length_and_content_controlled0.00100",
    ]);
  });

  it("swaps every cell when the column set changes under the same models", () => {
    const trajectory = [{ model: "voyage_4", source: "raw", gap: 0.003 }] as unknown as Row[];
    const genre = [{ model: "voyage_4", separation_auc: 0.66 }] as unknown as Row[];

    renderTable({
      rows: trajectory,
      columns: [
        { key: "model", label: "Name", type: "text" },
        { key: "source", label: "Source", type: "text" },
        { key: "gap", label: "Gap", type: "num", digits: 5 },
      ],
      sortKey: "gap",
    });
    expect(bodyRows()[0]).toHaveTextContent("raw");

    renderTable({
      rows: genre,
      columns: [
        { key: "model", label: "Name", type: "text" },
        { key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 },
      ],
      sortKey: "separation_auc",
    });
    expect(bodyRows()[0]).not.toHaveTextContent("raw");
    expect(within(bodyRows()[0]!).getAllByRole("cell")).toHaveLength(2);
  });

  it("warns rather than silently keying on the index when a row has no identity", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderTable({
      rows: [{ separation_auc: 0.9 }, { separation_auc: 0.8 }] as unknown as Row[],
      columns: [{ key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 }],
      sortKey: "separation_auc",
    });
    expect(bodyRows()).toHaveLength(2);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/no identifying field/i), {
      separation_auc: 0.9,
    });
    warn.mockRestore();
  });

  it("leaves a cell blank rather than stringifying a value that has no text form", () => {
    renderTable({
      rows: [{ ...ROWS[0]!, scope: undefined as unknown as string }],
      columns: [{ key: "scope", label: "Type", type: "text" }],
    });
    expect(within(bodyRows()[0]!).getAllByRole("cell")[0]).toBeEmptyDOMElement();
  });
});
