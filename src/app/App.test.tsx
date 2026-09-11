import { describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import type { DetailLoad } from "../widgets/model-detail";
import { EMPTY_DOMAIN_DATA } from "../shared/lib/results";
import type { DomainData } from "../shared/lib/results";
import type { DomainLoad } from "../shared/api";
import type { FamilyId } from "../shared/lib/corpus";

function parallelismRow(base: string, variant: string): Record<string, unknown> {
  return {
    model: `${base}_${variant}`,
    model_base: base,
    text_variant: variant,
    n_true: 1200,
    separation_auc: 0.7,
    separation_p_q: 0.001,
    auc_vs_baseline: 0.55,
    p_vs_baseline_q: 0.02,
    average_precision: 0.6,
    calibrated_effect_size: 1.2,
    mrr_forward: 0.4,
  };
}

const SEMANTIC: DomainData = {
  ...EMPTY_DOMAIN_DATA,
  parallelism_overall: [
    parallelismRow("alephbert", "consonantal"),
    parallelismRow("heberta", "vocalized"),
  ] as never,
  genre_overall: [] as never,
};

/** Families other than semantic were never benchmarked here, as phonological is not. */
const load = (family: FamilyId): Promise<DomainLoad> =>
  Promise.resolve(
    family === "semantic" ? { status: "loaded", data: SEMANTIC } : { status: "absent" },
  );

/** The detail pane fetches a second payload, so tests hand it one rather than a network. */
const PARALLELISM_STATS = {
  auc: 0.69,
  auc_ci_low: 0.66,
  auc_ci_high: 0.72,
  ap: 0.34,
  ap_ci_low: 0.31,
  ap_ci_high: 0.37,
};

const loadDetail = (): Promise<DetailLoad> =>
  Promise.resolve({
    status: "loaded",
    data: {
      model: "alephbert_consonantal",
      domain: "semantic",
      parallelism: { raincloud_groups: [], series: [], auc_ap_stats: PARALLELISM_STATS },
    },
  });

const renderApp = (): ReturnType<typeof render> =>
  render(<App load={load} loadDetail={loadDetail} />);

//: The detail pane is a lazy chunk carrying Plotly, which parses slowly when the suite fills the cores.
const DETAIL_WAIT = 20000;

describe("App", () => {
  it("keeps one toolbar mounted while the pane beneath it swaps", async () => {
    renderApp();
    const toolbar = screen.getByRole("radiogroup", { name: "Models" });
    expect(await screen.findByRole("table")).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("button", { name: "alephbert consonantal" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      await screen.findByText("ROC curve", undefined, { timeout: DETAIL_WAIT }),
    ).toBeInTheDocument();
    // The same node, so the toolbar was never unmounted and remounted.
    expect(screen.getByRole("radiogroup", { name: "Models" })).toBe(toolbar);
  });

  it("opens the chosen model, swapping the table for its charts", async () => {
    renderApp();
    await userEvent.click(await screen.findByRole("button", { name: "alephbert consonantal" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      await screen.findByText("ROC curve", undefined, { timeout: DETAIL_WAIT }),
    ).toBeInTheDocument();
    expect(screen.getByText("Precision–Recall curve")).toBeInTheDocument();
    expect(screen.getAllByText("alephbert_consonantal").length).toBeGreaterThan(0);
  });

  it("returns to the table from the View switch, clearing the open model", async () => {
    renderApp();
    await userEvent.click(await screen.findByRole("button", { name: "alephbert consonantal" }));
    await userEvent.click(screen.getByRole("radio", { name: "Table" }));

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText(/charts for the current selection/i)).not.toBeInTheDocument();
  });

  it("narrows the visible rows as a query is typed", async () => {
    renderApp();
    const before = (await screen.findAllByRole("row")).length;

    await userEvent.type(screen.getByLabelText("Filter"), "heberta");

    expect(screen.getAllByRole("row").length).toBeLessThan(before);
    expect(screen.getByRole("button", { name: "heberta vocalized" })).toBeInTheDocument();
  });

  it("names the family when it was never benchmarked, rather than reporting no matches", async () => {
    renderApp();
    await userEvent.click(screen.getByRole("radio", { name: "Phonological" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      await screen.findByText(/no benchmark has been run for phonological/i),
    ).toBeInTheDocument();
  });

  it("says the results could not be reached when loading fails, not that none exist", async () => {
    cleanup();
    render(<App load={() => Promise.resolve({ status: "failed" })} />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/could not be loaded/i);
    expect(alert).toHaveTextContent(/rather than an absence of findings/i);
  });

  it("swaps the benchmark filters when the benchmark changes", async () => {
    renderApp();
    expect(screen.getByLabelText("Type")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Genre" }));

    expect(screen.queryByLabelText("Type")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Genre")).toBeInTheDocument();
    expect(screen.getByLabelText("Metric")).toBeInTheDocument();
  });

  it("heads the page with the project name and the phrase explaining it", async () => {
    renderApp();
    // Settles the data load first, so its state update lands inside the test rather than after it.
    await screen.findByRole("table");
    // The heading is the site name alone, with this page's name under it.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tehillim");
    //: The bar says the same on every page, the panel below says the selection.
    expect(screen.getByText("Computational Analysis of Hebrew Psalms")).toBeInTheDocument();
  });

  it("carries the same nav as every other page, marking this one current", async () => {
    //: This page once headed itself, leaving no way to reach the others.
    renderApp();
    await screen.findByRole("table");
    const nav = screen.getByRole("navigation", { name: "Pages" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Benchmark", "Compare", "Cluster", "References"]);
    expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent("Benchmark");
  });

  it("leaves the nav links as plain hrefs when mounted outside the router", async () => {
    //: No `navigate` prop, so a click falls through to the browser.
    renderApp();
    await screen.findByRole("table");
    expect(screen.getByRole("link", { name: "Cluster" })).toHaveAttribute("href", "/cluster/");
  });
});
