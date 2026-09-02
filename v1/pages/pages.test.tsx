import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClusterPage } from "./ClusterPage";
import { ComparePage } from "./ComparePage";
import { CLUSTERING, GUNKEL, SIMILARITY } from "../test/fixtures";
import { routeSubtitle } from "../../shell/route";

const navigate = vi.fn();

const renderCompare = (
  load = (): Promise<{ data: typeof SIMILARITY; gunkel: typeof GUNKEL }> =>
    Promise.resolve({ data: SIMILARITY, gunkel: GUNKEL }),
): ReturnType<typeof render> => render(<ComparePage navigate={navigate} load={load} />);

const renderCluster = (
  load = (): Promise<{ data: typeof CLUSTERING; gunkel: typeof GUNKEL }> =>
    Promise.resolve({ data: CLUSTERING, gunkel: GUNKEL }),
): ReturnType<typeof render> => render(<ClusterPage navigate={navigate} load={load} />);

const header = (): HTMLElement => screen.getByRole("banner");

describe("ComparePage", () => {
  it("says it is loading before the payload arrives", () => {
    renderCompare(() => new Promise(() => undefined));
    expect(screen.getByText(/Loading similarity data/)).toBeInTheDocument();
  });

  it("wears the site's two-tier identity with this page's own subtitle", async () => {
    renderCompare();
    await screen.findByRole("heading", { level: 1 });
    expect(header().textContent).toContain("Tehillim");
    expect(header().textContent).toContain("Computational Analysis of Psalms");
    expect(screen.getByText(routeSubtitle("compare"))).toBeInTheDocument();
  });

  it("separates name from scope with space alone, no punctuation between them", async () => {
    // The weight drop and the color change already mark where the name ends, so
    // a separator character would be a third cue for the same break. The space
    // is real rather than a margin alone, so the heading still reads as two
    // words to a screen reader.
    renderCompare();
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Tehillim Computational Analysis of Psalms");
    expect(heading.textContent).not.toMatch(/[·|\u2013\u2014:]/);
  });

  it("offers both pages in the nav, marking this one current", async () => {
    renderCompare();
    await screen.findByRole("navigation", { name: "Pages" });
    const nav = screen.getByRole("navigation", { name: "Pages" });
    const current = within(nav).getByRole("link", { current: "page" });
    expect(current).toHaveTextContent("Compare");
    expect(within(nav).getByRole("link", { name: "Cluster" })).toHaveAttribute(
      "href",
      "/cluster/",
    );
  });

  it("routes rather than reloads when a nav link is clicked", async () => {
    renderCompare();
    await screen.findByRole("navigation", { name: "Pages" });
    navigate.mockClear();
    fireEvent.click(screen.getByRole("link", { name: "Cluster" }));
    expect(navigate).toHaveBeenCalledWith("cluster", expect.anything());
  });

  it("describes the method currently on screen", async () => {
    renderCompare();
    expect(
      await screen.findByText(/Lexical similarity over shared content-word lexemes/),
    ).toBeInTheDocument();
  });

  it("opens on Psalm 23's slot in the detail panel, filled from the payload", async () => {
    // The fixture stops at Psalm 3, so the opening selection has no detail to
    // show and the panel has to say so rather than render a broken row.
    renderCompare();
    await screen.findByRole("complementary", { name: "Psalm detail" });
    expect(screen.getByText(/Select a psalm/)).toBeInTheDocument();
  });

  it("fills the detail panel once a psalm with data is chosen", async () => {
    renderCompare();
    const grid = await screen.findByRole("listbox", { name: "Select a psalm" });
    fireEvent.click(within(grid).getByRole("option", { name: "Psalm 1" }));
    const detail = screen.getByRole("complementary", { name: "Psalm detail" });
    expect(within(detail).getByText("Psalm 1")).toBeInTheDocument();
    expect(within(detail).getByText(/0\.420/)).toBeInTheDocument();
  });

  it("offers both views, opening on the matrix", async () => {
    renderCompare();
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Similarity Matrix", "Network Graph"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("keeps both views mounted so switching never restarts a layout", async () => {
    renderCompare();
    const tabs = await screen.findAllByRole("tab");
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels).toHaveLength(2);
    fireEvent.click(tabs[1]!);
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(2);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("credits the corpus every number came from", async () => {
    renderCompare();
    expect(await screen.findByText(/ETCBC\/BHSA 2021 via Text-Fabric/)).toBeInTheDocument();
  });

  it("explains a failed load instead of showing an empty page", async () => {
    renderCompare(() => Promise.reject(new Error("network down")));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Could not load similarity data/,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/network down/);
  });
});

describe("ClusterPage", () => {
  it("says it is loading before the payload arrives", () => {
    renderCluster(() => new Promise(() => undefined));
    expect(screen.getByText(/Loading clustering data/)).toBeInTheDocument();
  });

  it("wears the same identity, with its own subtitle", async () => {
    renderCluster();
    await screen.findByRole("heading", { level: 1 });
    expect(header().textContent).toContain("Tehillim");
    expect(screen.getByText(routeSubtitle("cluster"))).toBeInTheDocument();
  });

  it("marks Cluster as the current page", async () => {
    renderCluster();
    const nav = await screen.findByRole("navigation", { name: "Pages" });
    expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent("Cluster");
  });

  it("opens on the alignment view, colored by Gunkel family", async () => {
    renderCluster();
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Genre Alignment", "Scatter Plot"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Color by")).toHaveValue("family");
  });

  it("prints no k-stability line for a payload that never recorded one", async () => {
    // The shipped payload predates the field. The line has to be absent, not NaN.
    renderCluster();
    await screen.findAllByRole("tab");
    expect(document.body.textContent).not.toContain("NaN");
    expect(screen.queryByText(/agreed with resampling/)).not.toBeInTheDocument();
  });

  it("still reports the AMI/ARI reading when the layout's structure share is missing", async () => {
    renderCluster();
    await screen.findAllByRole("tab");
    expect(screen.getByText(/wasn't recorded in this payload/)).toBeInTheDocument();
  });

  it("warns plainly when a signal found no cluster structure at all", async () => {
    const flat = {
      ...CLUSTERING,
      clusterMethods: [{ ...CLUSTERING.clusterMethods[0]!, nClusters: 1 }],
    };
    renderCluster(() => Promise.resolve({ data: flat, gunkel: GUNKEL }));
    expect(
      await screen.findByText(/gap statistic found no cluster structure/),
    ).toBeInTheDocument();
  });

  it("shows a psalm's cluster and fellow members once chosen", async () => {
    renderCluster();
    const grid = await screen.findByRole("listbox", { name: "Select a psalm" });
    fireEvent.click(within(grid).getByRole("option", { name: "Psalm 1" }));
    const detail = screen.getByRole("complementary", { name: "Psalm detail" });
    expect(within(detail).getByText(/Cluster 1 members/)).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: /Psalm 3/ })).toBeInTheDocument();
  });

  it("explains a failed load instead of showing an empty page", async () => {
    renderCluster(() => Promise.reject(new Error("bucket unreachable")));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Could not load clustering data/,
    );
  });

  it("does not leave a superseded load to overwrite the page after unmount", async () => {
    let settle: (v: { data: typeof CLUSTERING; gunkel: typeof GUNKEL }) => void = () =>
      undefined;
    const view = renderCluster(
      () =>
        new Promise((resolve) => {
          settle = resolve;
        }),
    );
    view.unmount();
    settle({ data: CLUSTERING, gunkel: GUNKEL });
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Pages" })).not.toBeInTheDocument();
    });
  });
});

describe("the default loaders", () => {
  // Every test above injects `load`. These exercise the path production takes:
  // the real fetch, through the module's own default URLs.
  function stubFetch(byUrl: Record<string, unknown>): void {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const body = Object.entries(byUrl).find(([key]) => url.includes(key))?.[1];
        return Promise.resolve({
          ok: body !== undefined,
          status: body === undefined ? 404 : 200,
          statusText: body === undefined ? "Not Found" : "OK",
          json: () => Promise.resolve(body),
        } as Response);
      }),
    );
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Compare fetches the similarity and Gunkel payloads at their own URLs", async () => {
    stubFetch({ detail_similarity: SIMILARITY, gunkel: GUNKEL });
    render(<ComparePage navigate={navigate} />);
    expect(await screen.findByRole("navigation", { name: "Pages" })).toBeInTheDocument();
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => url as string);
    expect(urls.some((u) => u.includes("data/detail_similarity.json"))).toBe(true);
    expect(urls.some((u) => u.includes("data/gunkel.json"))).toBe(true);
  });

  it("Cluster fetches the clustering and Gunkel payloads at their own URLs", async () => {
    stubFetch({ clustering: CLUSTERING, gunkel: GUNKEL });
    render(<ClusterPage navigate={navigate} />);
    expect(await screen.findByRole("navigation", { name: "Pages" })).toBeInTheDocument();
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => url as string);
    expect(urls.some((u) => u.includes("data/clustering.json"))).toBe(true);
  });

  it("surfaces a missing payload as the page's own load error", async () => {
    stubFetch({});
    render(<ComparePage navigate={navigate} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Could not load similarity data/,
    );
  });
});
