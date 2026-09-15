import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VizHead } from "./VizHead";

describe("VizHead", () => {
  it("leads with the page name and crosses the crumbs after it", () => {
    render(
      <VizHead
        subject="Benchmark"
        crumbs={[
          { kind: "major", label: "Lexical" },
          { kind: "major", label: "Parallelism" },
        ]}
      />,
    );
    expect(screen.getByText("Benchmark")).toBeInTheDocument();
    expect(screen.getByText("Lexical").parentElement).toHaveTextContent(
      "BenchmarkLexical×Parallelism",
    );
  });

  it("puts nothing between the name and a lone crumb", () => {
    render(<VizHead subject="Compare" crumbs={[{ kind: "model", label: "bge_m3" }]} />);
    expect(screen.getByText("bge_m3").parentElement).toHaveTextContent(/^Comparebge_m3$/);
  });

  it("seats the page's controls on the rail beside the name", () => {
    render(
      <VizHead subject="Benchmark" crumbs={[]}>
        <input aria-label="Filter" />
      </VizHead>,
    );
    expect(screen.getByLabelText("Filter")).toBeInTheDocument();
  });
});
