import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenreAlignmentView } from "./GenreAlignmentView";
import { CLUSTERING } from "../test/fixtures";
import type { SelectedAlignmentCell } from "../lib/alignmentCell";

const ALIGNMENT = CLUSTERING.clusterMethods[0]!.genreAlignment;

function renderView(
  clusterMethodId = "verb-morphology-spectral",
  selected: SelectedAlignmentCell | null = null,
): ReturnType<typeof render> {
  return render(
    <GenreAlignmentView
      alignment={ALIGNMENT}
      genreColorOf={() => "#5b9bea"}
      selected={selected}
      clusterMethodId={clusterMethodId}
    />,
  );
}

describe("GenreAlignmentView", () => {
  it("reports purity, AMI and ARI to two places", () => {
    renderView();
    for (const label of ["Purity", "AMI", "ARI"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(screen.getByText("0.50")).toBeInTheDocument();
    expect(screen.getByText("0.40")).toBeInTheDocument();
  });

  it("tucks the exact counts behind a disclosure, with the alluvial leading", () => {
    const { container } = renderView();
    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(within(details!).getByText("Exact counts")).toBeInTheDocument();
  });

  it("captions each column with the cluster's best-matching genre", () => {
    renderView();
    expect(screen.getByText("best match: Hymn")).toBeInTheDocument();
    expect(screen.getByText("best match: Individual Lament")).toBeInTheDocument();
  });

  it("says so plainly when a cluster matched no genre strongly enough", () => {
    render(
      <GenreAlignmentView
        alignment={{ ...ALIGNMENT, clusterGenreLabels: [null, null] }}
        genreColorOf={() => "#5b9bea"}
        selected={null}
        clusterMethodId="verb-morphology-spectral"
      />,
    );
    expect(screen.getAllByText("no strong match")).toHaveLength(2);
  });

  it("gives every genre row its own total", () => {
    renderView();
    expect(screen.getAllByText("1 psalms")).toHaveLength(2);
  });

  it("leaves a zero cell empty rather than printing a 0", () => {
    const { container } = renderView();
    const cells = [...container.querySelectorAll("tbody td")].map((td) => td.textContent);
    expect(cells).toEqual(["1", "", "", "1"]);
  });

  it("shows no thematic caveat for a grammatical-form signal", () => {
    renderView("verb-morphology-spectral");
    expect(screen.queryByText(/Thematic signal, not genre/)).not.toBeInTheDocument();
  });

  it("caveats a vocabulary signal, whose genre alignment is only a coincidence check", () => {
    renderView("lexical-spectral");
    expect(screen.getByText(/Thematic signal, not genre/)).toBeInTheDocument();
  });

  it("states what the table's number and shading each mean", () => {
    renderView();
    expect(screen.getByText(/Number = psalm count/)).toBeInTheDocument();
    expect(screen.getByText(/darker = more concentrated/)).toBeInTheDocument();
  });
});
