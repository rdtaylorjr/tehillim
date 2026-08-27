import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RowStats } from "./RowStats";
import type { TableColumn } from "../../../shared/lib/results";

interface Row {
  model_base: string;
  separation_auc: number;
  separation_p_q: number;
  scope: string;
}

const columns: TableColumn<Row>[] = [
  { key: "model_base", label: "Name", type: "text" },
  { key: "separation_auc", label: "Separation AUC", type: "num", digits: 4 },
  { key: "separation_p_q", label: "Sig (FDR q)", type: "pill", pillPrefix: "q" },
  { key: "scope", label: "Type", type: "text" },
];
const row: Row = {
  model_base: "berel",
  separation_auc: 0.8436,
  separation_p_q: 0.0004,
  scope: "Synonymous",
};

const show = (over: Partial<React.ComponentProps<typeof RowStats<Row>>> = {}): void => {
  cleanup();
  render(<RowStats row={row} columns={columns} {...over} />);
};

describe("RowStats", () => {
  it("carries every statistic from the clicked row", () => {
    show();
    expect(screen.getByText("Separation AUC")).toBeInTheDocument();
    expect(screen.getByText("0.8436")).toBeInTheDocument();
    expect(screen.getByText("Synonymous")).toBeInTheDocument();
  });

  it("formats each value the way the table did, so the two never disagree", () => {
    show();
    expect(screen.getByText("q=<0.001")).toBeInTheDocument();
  });

  it("omits the name, which the breadcrumb already states", () => {
    show();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.queryByText("berel")).not.toBeInTheDocument();
  });

  it("renders nothing when no row is available", () => {
    cleanup();
    const { container } = render(<RowStats row={null} columns={columns} />);
    expect(container).toBeEmptyDOMElement();
  });
});
