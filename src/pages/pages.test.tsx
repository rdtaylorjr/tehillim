import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClusterPage } from "./cluster";
import { ComparePage } from "./compare";
import { HomePage } from "./home";
import { ReferencesPage } from "./references";
import type { ReferencesPayload } from "./references";
import { CLUSTERING, GUNKEL, SIMILARITY } from "../test/fixtures";

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

  it("heads the page with the site name and this page's own name", async () => {
    renderCompare();
    await screen.findByRole("heading", { level: 1 });
    expect(header().textContent).toContain("Tehillim");
  });

  it("says the same thing on every page, the panel below saying which selection", async () => {
    //: The nav marks the page and the panel heads itself, so a third name repeats.
    renderCompare();
    const heading = await screen.findByRole("heading", { level: 1 });
    // The Hebrew name leads, the transliteration follows.
    expect(heading.textContent).toBe("תהלים Tehillim");
    expect(screen.getByText("Computational Analysis of Hebrew Psalms")).toBeInTheDocument();
    expect(header().textContent).not.toMatch(/Pairwise Similarity/);
  });

  it("offers every page in the nav, marking this one current", async () => {
    renderCompare();
    await screen.findByRole("navigation", { name: "Pages" });
    const nav = screen.getByRole("navigation", { name: "Pages" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Benchmark", "Compare", "Cluster", "References"]);
    const current = within(nav).getByRole("link", { current: "page" });
    expect(current).toHaveTextContent("Compare");
    expect(within(nav).getByRole("link", { name: "Cluster" })).toHaveAttribute(
      "href",
      "/cluster/",
    );
    expect(within(nav).getByRole("link", { name: "References" })).toHaveAttribute(
      "href",
      "/references/",
    );
  });

  it("keeps the header to identity and wayfinding, the picker with what it changes", async () => {
    //: The representation decides what the panel shows, so it belongs in its band.
    renderCompare();
    const panel = await screen.findByRole("region", { name: "Visualization" });
    const picker = screen.getByRole("radiogroup", { name: "Models" });
    expect(panel).toContainElement(picker);
    expect(header()).not.toContainElement(picker);
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
    //: The fixture stops at Psalm 3, so the panel must say it has nothing to show.
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

  it("wears the same identity as every other page", async () => {
    renderCluster();
    await screen.findByRole("heading", { level: 1 });
    expect(header().textContent).toContain("Tehillim");
    expect(screen.getByText("Computational Analysis of Hebrew Psalms")).toBeInTheDocument();
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

  it("keeps both views mounted so switching never restarts a layout", async () => {
    renderCluster();
    const tabs = await screen.findAllByRole("tab");
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels).toHaveLength(2);
    fireEvent.click(tabs[1]!);
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(2);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
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

describe("HomePage", () => {
  it("opens straight on the three tools, with nothing before them", () => {
    render(<HomePage navigate={navigate} />);
    expect(screen.getByRole("list").previousElementSibling).toBeNull();
  });

  it("showcases exactly the three tools, measurement first", () => {
    render(<HomePage navigate={navigate} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Benchmark",
      "Compare",
      "Cluster",
    ]);
  });

  it("makes each whole card the link, not a link buried inside it", () => {
    render(<HomePage navigate={navigate} />);
    const cards = screen.getByRole("list");
    const card = within(cards).getByRole("link", { name: /Benchmark/ });
    expect(card).toHaveAttribute("href", "/benchmark/");
    expect(within(card).getByRole("heading", { level: 3 })).toHaveTextContent("Benchmark");
  });

  it("routes rather than reloads when a card is clicked", () => {
    render(<HomePage navigate={navigate} />);
    const cards = screen.getByRole("list");
    navigate.mockClear();
    fireEvent.click(within(cards).getByRole("link", { name: /Cluster/ }));
    expect(navigate).toHaveBeenCalledWith("cluster", expect.anything());
  });

  it("sends the reader to the tools and nowhere else", () => {
    //: The nav reaches References from every page, so the body need not repeat it.
    render(<HomePage navigate={navigate} />);
    const cards = screen.getByRole("list");
    expect(
      within(cards)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/benchmark/", "/compare/", "/cluster/"]);
  });

  it("marks no nav item current, home not being one of them", () => {
    render(<HomePage navigate={navigate} />);
    const nav = screen.getByRole("navigation", { name: "Pages" });
    expect(within(nav).queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });
});

describe("the masthead", () => {
  it("is the way home from every page", () => {
    render(<HomePage navigate={navigate} />);
    const home = screen.getAllByRole("link", { name: /Tehillim/ })[0];
    expect(home).toHaveAttribute("href", "/");
  });

  it("routes home rather than reloading", async () => {
    renderCompare();
    await screen.findByRole("navigation", { name: "Pages" });
    navigate.mockClear();
    fireEvent.click(screen.getAllByRole("link", { name: /Tehillim/ })[0]!);
    expect(navigate).toHaveBeenCalledWith("home", expect.anything());
  });
});

const REFERENCES: ReferencesPayload = {
  collection: "Tehillim",
  count: 3,
  sections: [
    {
      name: "A. Hebrew Psalms",
      groups: [
        {
          name: "1. Computational",
          entries: [
            {
              id: "AAA",
              type: "Journal Article",
              title: "A recent computational study",
              titleStyle: "quoted",
              containerPrefix: "",
              creators: "Roorda, Dirk.",
              date: "2019",
              year: 2019,
              container: "HIPHIL Novum",
              detail: "5.2: 126-135",
              url: "https://doi.org/10.7146/hn.v5i2.142740",
            },
            {
              id: "BBB",
              type: "Book Section",
              title: "An older chapter",
              titleStyle: "quoted",
              containerPrefix: "",
              creators: "Talstra, Eep.",
              date: "1996",
              year: 1996,
              container: "Give Ear to My Words",
              detail: "11-22",
              url: "",
            },
          ],
        },
        {
          name: "2. Quantitative / 1. Nested deeper",
          entries: [
            {
              id: "DDD",
              type: "Thesis",
              title: "A work filed two levels down",
              titleStyle: "quoted",
              containerPrefix: "",
              creators: "Someone, A.",
              date: "2005",
              year: 2005,
              container: "PhD diss., VU Amsterdam",
              detail: "",
              url: "",
            },
          ],
        },
      ],
    },
    {
      name: "Context",
      groups: [
        {
          name: null,
          entries: [
            {
              id: "CCC",
              type: "Book",
              title: "Einleitung in die Psalmen",
              titleStyle: "quoted",
              containerPrefix: "",
              creators: "Gunkel, Hermann, and Joachim Begrich.",
              date: "1933",
              year: 1933,
              container: "Vandenhoeck & Ruprecht",
              detail: "",
              url: "",
            },
          ],
        },
      ],
    },
  ],
};

const renderReferences = (
  load = (): Promise<ReferencesPayload> => Promise.resolve(REFERENCES),
): ReturnType<typeof render> => render(<ReferencesPage navigate={navigate} load={load} />);

describe("ReferencesPage", () => {
  const filter = (): HTMLElement => screen.getByLabelText("Filter");
  const contents = (): HTMLElement =>
    screen.getByRole("navigation", { name: "Bibliography contents" });
  /** The citations panel's subject line, read positionally since the nav shares its name. */
  const head = (): HTMLElement =>
    screen.getByRole("region", { name: "References" }).firstElementChild!
      .firstElementChild as HTMLElement;

  it("wears the same identity and marks References as the current page", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    expect(header().textContent).toContain("Tehillim");
    const nav = screen.getByRole("navigation", { name: "Pages" });
    expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent("References");
  });

  it("offers every scope in the selector, each with the works it holds", async () => {
    //: A count promises the row is a scope, so every scope carries one.
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    expect(
      within(contents())
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual([
      "A. Hebrew Psalms3",
      "1. Computational2",
      "2. Quantitative / 1. Nested deeper1",
      "Context1",
    ]);
  });

  it("opens on the first category rather than the whole bibliography", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    expect(head().textContent).toBe("ReferencesA. Hebrew Psalms");
    expect(screen.getByText(/A recent computational study/)).toBeInTheDocument();
    expect(screen.queryByText(/Einleitung in die Psalmen/)).not.toBeInTheDocument();
  });

  it("names the chosen category in the head, so the body never repeats it", async () => {
    renderReferences();
    fireEvent.click(await screen.findByRole("button", { name: "Context1" }));
    expect(head().textContent).toBe("ReferencesContext");
    expect(screen.queryByRole("heading", { name: "Context" })).not.toBeInTheDocument();
  });

  it("narrows to one run when a subcategory is chosen", async () => {
    renderReferences();
    fireEvent.click(await screen.findByRole("button", { name: "1. Computational2" }));
    expect(screen.getByText(/A recent computational study/)).toBeInTheDocument();
    expect(screen.queryByText(/A work filed two levels down/)).not.toBeInTheDocument();
  });

  it("keeps the subcategory in the body, since the head never names one", async () => {
    renderReferences();
    const heading = await screen.findByRole("heading", { name: "1. Computational" });
    expect(heading.tagName).toBe("H3");
    expect(
      screen.getByRole("heading", { name: "2. Quantitative / 1. Nested deeper" }),
    ).toBeInTheDocument();
  });

  it("leaves a category's ungrouped run unheaded, the category above already naming it", async () => {
    renderReferences();
    fireEvent.click(await screen.findByRole("button", { name: "Context1" }));
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText(/Einleitung in die Psalmen/)).toBeInTheDocument();
  });

  it("orders a run newest first", async () => {
    renderReferences();
    await screen.findByRole("heading", { name: "1. Computational" });
    const years = screen.getAllByText(/^(2019|1996)\.\s*$/).map((e) => e.textContent.trim());
    expect(years).toEqual(["2019.", "1996."]);
  });

  it("links a work that has a DOI and leaves one without a link plain", async () => {
    renderReferences();
    await screen.findByRole("heading", { name: "1. Computational" });
    const linked = screen.getByRole("link", { name: /A recent computational study/ });
    expect(linked).toHaveAttribute("href", "https://doi.org/10.7146/hn.v5i2.142740");
    expect(linked).toHaveAttribute("rel", "noopener noreferrer");
    //: The whole citation is the target, the item type beside it staying out of it.
    expect(linked).toHaveTextContent(/^Roorda/);
    expect(linked.textContent).not.toContain("Journal Article");
    expect(screen.queryByRole("link", { name: /An older chapter/ })).not.toBeInTheDocument();
  });

  it("names the item type on every work, the way Zotero holds it", async () => {
    renderReferences();
    await screen.findByRole("heading", { name: "1. Computational" });
    expect(screen.getByText("Journal Article")).toBeInTheDocument();
    expect(screen.getByText("Book Section")).toBeInTheDocument();
    expect(screen.getByText("Thesis")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Context1" }));
    expect(screen.getByText("Book")).toBeInTheDocument();
  });

  it("narrows the works and the selector together", async () => {
    //: An emptied scope loses its row, so the selector always offers something.
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    fireEvent.change(filter(), { target: { value: "roorda" } });
    expect(screen.getByText(/A recent computational study/)).toBeInTheDocument();
    expect(
      within(contents())
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["A. Hebrew Psalms1", "1. Computational1"]);
  });

  it("matches across author, title and year, in any order", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    fireEvent.change(filter(), { target: { value: "1996 talstra" } });
    expect(screen.getByText(/An older chapter/)).toBeInTheDocument();
    expect(screen.queryByText(/A recent computational study/)).not.toBeInTheDocument();
  });

  it("puts every category back in the selector when nothing matches", async () => {
    //: A selector narrowed to nothing would leave the reader no way out of the filter.
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    fireEvent.change(filter(), { target: { value: "zzzz" } });
    expect(
      within(contents())
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual([
      "A. Hebrew Psalms3",
      "1. Computational2",
      "2. Quantitative / 1. Nested deeper1",
      "Context1",
    ]);
  });

  it("drops the filter when a category is chosen, whether or not it matched", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    fireEvent.change(filter(), { target: { value: "zzzz" } });
    fireEvent.click(screen.getByRole("button", { name: "Context1" }));
    expect(filter()).toHaveValue("");
    expect(screen.getByText(/Einleitung in die Psalmen/)).toBeInTheDocument();

    fireEvent.change(filter(), { target: { value: "roorda" } });
    fireEvent.click(screen.getByRole("button", { name: "1. Computational1" }));
    expect(filter()).toHaveValue("");
    expect(screen.getByText(/An older chapter/)).toBeInTheDocument();
  });

  it("says so plainly when nothing matches", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    fireEvent.change(filter(), { target: { value: "zzzz" } });
    expect(screen.getByText("No works match.")).toBeInTheDocument();
  });

  it("searches the whole bibliography, not the chosen category", async () => {
    renderReferences();
    fireEvent.click(await screen.findByRole("button", { name: "Context1" }));
    fireEvent.change(filter(), { target: { value: "roorda" } });
    expect(screen.getByText(/A recent computational study/)).toBeInTheDocument();
  });

  it("marks the chosen scope in the selector, and no scope while a filter runs", async () => {
    renderReferences();
    fireEvent.click(await screen.findByRole("button", { name: "1. Computational2" }));
    expect(within(contents()).getByRole("button", { current: true })).toHaveTextContent(
      "1. Computational",
    );
    fireEvent.change(filter(), { target: { value: "roorda" } });
    expect(within(contents()).queryByRole("button", { current: true })).not.toBeInTheDocument();
    fireEvent.change(filter(), { target: { value: "" } });
    expect(within(contents()).getByRole("button", { current: true })).toHaveTextContent(
      "1. Computational",
    );
  });

  it("heads each run of results with its category path while filtering", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    fireEvent.change(filter(), { target: { value: "roorda" } });
    //: The results span categories, so the head names none of them.
    expect(head().textContent).toBe("References");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "A. Hebrew Psalms / 1. Computational",
    ]);
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
  });

  it("names an ungrouped run by its category alone while filtering", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    fireEvent.change(filter(), { target: { value: "gunkel" } });
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Context",
    ]);
  });

  it("returns to the chosen category when the filter is cleared", async () => {
    renderReferences();
    fireEvent.click(await screen.findByRole("button", { name: "Context1" }));
    fireEvent.change(filter(), { target: { value: "roorda" } });
    fireEvent.change(filter(), { target: { value: "" } });
    expect(screen.getByText(/Einleitung in die Psalmen/)).toBeInTheDocument();
    expect(screen.queryByText(/A recent computational study/)).not.toBeInTheDocument();
  });

  it("offers the whole list as BibTeX", async () => {
    renderReferences();
    const bib = await screen.findByRole("link", { name: /BibTeX/ });
    expect(bib).toHaveAttribute("href", "/data/references.bib");
    expect(bib).toHaveAttribute("download");
  });

  it("says how to regenerate it rather than showing an empty page on failure", async () => {
    renderReferences(() => Promise.reject(new Error("404")));
    expect(await screen.findByRole("alert")).toHaveTextContent(/npm run references/);
  });

  it("routes rather than reloads when a nav link is clicked", async () => {
    renderReferences();
    await screen.findByRole("navigation", { name: "Bibliography contents" });
    navigate.mockClear();
    fireEvent.click(screen.getByRole("link", { name: "Compare" }));
    expect(navigate).toHaveBeenCalledWith("compare", expect.anything());
  });
});

describe("the default loaders", () => {
  //: These exercise the real fetch through the module's default URLs.
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
