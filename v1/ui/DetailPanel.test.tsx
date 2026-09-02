import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClusterDetailPanel, DetailPanel, DetailShell, EmptyDetail } from "./DetailPanel";
import { CLUSTERING, PSALMS, SIMILARITY } from "../test/fixtures";

const METHOD = SIMILARITY.methods[0]!;
const CLUSTER_METHOD = CLUSTERING.clusterMethods[0]!;

const renderCompare = (
  psalmNumber: number,
  onSelectPsalm = vi.fn(),
): ReturnType<typeof vi.fn> => {
  render(
    <DetailPanel
      psalms={PSALMS}
      method={METHOD}
      psalmNumber={psalmNumber}
      onSelectPsalm={onSelectPsalm}
    />,
  );
  return onSelectPsalm;
};

const renderCluster = (
  psalmNumber: number,
  onSelectPsalm = vi.fn(),
): ReturnType<typeof vi.fn> => {
  render(
    <ClusterDetailPanel
      psalms={PSALMS}
      method={CLUSTER_METHOD}
      psalmNumber={psalmNumber}
      onSelectPsalm={onSelectPsalm}
    />,
  );
  return onSelectPsalm;
};

describe("DetailShell", () => {
  it("names the region so the column is reachable as one landmark", () => {
    render(
      <DetailShell>
        <EmptyDetail>nothing selected</EmptyDetail>
      </DetailShell>,
    );
    expect(screen.getByRole("complementary", { name: "Psalm detail" })).toBeInTheDocument();
  });
});

describe("DetailPanel", () => {
  it("heads the panel with the psalm and its incipit", () => {
    renderCompare(1);
    expect(screen.getByText("Psalm 1")).toBeInTheDocument();
    expect(screen.getByText("אַשְׁרֵי־הָאִישׁ")).toBeInTheDocument();
  });

  it("states verses, words and distinct terms", () => {
    renderCompare(1);
    expect(screen.getByText("6").parentElement?.textContent).toContain("verses");
    expect(screen.getByText("90").parentElement?.textContent).toContain("words");
    expect(screen.getByText("30").parentElement?.textContent).toContain("distinct terms");
  });

  it("lists the psalm's own top terms", () => {
    renderCompare(1);
    expect(screen.getByText("אשׁר")).toBeInTheDocument();
    expect(screen.getByText("happy")).toBeInTheDocument();
  });

  it("ranks matches highest first, with their scores", () => {
    renderCompare(1);
    const items = screen.getAllByRole("button");
    expect(items[0]?.textContent).toContain("Psalm 2");
    expect(items[0]?.textContent).toContain("0.420");
    expect(items[1]?.textContent).toContain("Psalm 3");
  });

  it("shows each match's own incipit", () => {
    renderCompare(1);
    expect(screen.getByText("לָמָּה רָגְשׁוּ גוֹיִם")).toBeInTheDocument();
  });

  it("shows the terms a match shares with the selected psalm", () => {
    renderCompare(1);
    expect(screen.getByText("יהוה")).toBeInTheDocument();
  });

  it("reports the match a reader clicks, so the panel can walk the corpus", () => {
    const onSelect = renderCompare(1);
    fireEvent.click(screen.getByRole("button", { name: /Psalm 3/ }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("falls back to the empty state for a psalm the method has no stats for", () => {
    render(
      <DetailPanel
        psalms={PSALMS}
        method={{ ...METHOD, psalmStats: [] }}
        psalmNumber={1}
        onSelectPsalm={vi.fn()}
      />,
    );
    expect(screen.getByText(/Select a psalm/)).toBeInTheDocument();
  });

  it("renders a psalm with no top terms without an empty chip row", () => {
    renderCompare(2);
    expect(screen.getByText("Psalm 2")).toBeInTheDocument();
  });
});

describe("ClusterDetailPanel", () => {
  it("states the psalm's cluster and that cluster's size", () => {
    renderCluster(1);
    expect(screen.getByText("Cluster 1").parentElement?.textContent).toContain("Cluster 1");
    expect(screen.getByText("2").parentElement?.textContent).toContain("psalms in cluster");
  });

  it("lists the cluster's other members, never the psalm itself", () => {
    renderCluster(1);
    const members = screen.getAllByRole("button").map((b) => b.textContent);
    expect(members.some((m) => m.includes("Psalm 3"))).toBe(true);
    expect(members.some((m) => m.includes("Psalm 1"))).toBe(false);
  });

  it("shows no score bars, because a partition is not a ranking", () => {
    renderCluster(1);
    expect(screen.queryByText(/^0\.\d{3}$/)).not.toBeInTheDocument();
  });

  it("reports the member a reader clicks", () => {
    const onSelect = renderCluster(1);
    fireEvent.click(screen.getByRole("button", { name: /Psalm 3/ }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("renders a single-member cluster with an empty member list", () => {
    renderCluster(2);
    expect(screen.getByText("Cluster 2")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("falls back to the empty state for a psalm this method never assigned", () => {
    render(
      <ClusterDetailPanel
        psalms={PSALMS}
        method={{ ...CLUSTER_METHOD, assignments: {} }}
        psalmNumber={1}
        onSelectPsalm={vi.fn()}
      />,
    );
    expect(screen.getByText(/Select a psalm/)).toBeInTheDocument();
  });
});
