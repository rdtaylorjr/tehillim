import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import type { DetailLoad } from "../widgets/model-detail";
import { EMPTY_DOMAIN_DATA } from "../shared/lib/results";
import type { DomainData } from "../shared/lib/results";
import type { DomainLoad } from "../shared/api";
import type { FamilyId } from "../shared/lib/catalog";

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

/** Families other than semantic were never benchmarked here, as phonology and discourse are not. */
const load = (family: FamilyId): Promise<DomainLoad> =>
  Promise.resolve(
    family === "semantic" ? { status: "loaded", data: SEMANTIC } : { status: "absent" },
  );

/** The detail pane fetches its own payload, so tests hand it one rather than a network. */
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

describe("App", () => {
  it("keeps one toolbar mounted while the pane beneath it swaps", async () => {
    renderApp();
    const toolbar = screen.getByRole("radiogroup", { name: "Models" });
    expect(await screen.findByRole("table")).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("button", { name: "alephbert consonantal" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      await screen.findByText("ROC curve", undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    // The same node, so the toolbar was never unmounted and remounted.
    expect(screen.getByRole("radiogroup", { name: "Models" })).toBe(toolbar);
  });

  it("opens the chosen model, swapping the table for its charts", async () => {
    renderApp();
    await userEvent.click(await screen.findByRole("button", { name: "alephbert consonantal" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      await screen.findByText("ROC curve", undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Precision–Recall curve")).toBeInTheDocument();
    expect(screen.getAllByText("alephbert_consonantal").length).toBeGreaterThan(0);
  });

  it("returns to the table from Back, clearing the open model", async () => {
    renderApp();
    await userEvent.click(await screen.findByRole("button", { name: "alephbert consonantal" }));
    await userEvent.click(screen.getByRole("button", { name: /back/i }));

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
    await userEvent.click(screen.getByRole("radio", { name: "Phonology" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      await screen.findByText(/no benchmark has been run for phonology/i),
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
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Tehillim · Computational Analysis of Psalms",
    );
    expect(screen.getByText("Hebrew Psalm Representation Benchmarks")).toBeInTheDocument();
  });
});
