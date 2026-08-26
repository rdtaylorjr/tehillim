import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import type { DomainData } from "../shared/lib/results";
import type { DomainLoad } from "../shared/api";
import { GENRES, PARALLELISM_TYPES, TRAJECTORY_METRICS } from "../shared/lib/catalog";
import type { FamilyId } from "../shared/lib/catalog";

/**
 * One row per section, shaped like the real export: a trajectory row repeats its model once
 * per source, which is what made a model-only React key collide and strand stale cells.
 */
const MODELS = ["alpha", "beta"];
const SOURCES = ["raw", "length_controlled", "length_and_content_controlled"];

const stats = {
  separation_auc: 0.7,
  separation_p_q: 0.004,
  auc_vs_baseline: 0.55,
  p_vs_baseline_q: 0.02,
  average_precision: 0.6,
  calibrated_effect_size: 1.2,
  mrr_forward: 0.4,
  n_true: 1200,
  auc_ci_low: 0.61,
  auc_ci_high: 0.72,
  ap_ci_low: 0.5,
  ap_ci_high: 0.66,
  prevalence: 0.3,
  n_same_genre: 2791,
  n_different_genre: 8384,
};

const trajectoryStats = Object.fromEntries(
  SOURCES.flatMap((source) => [
    [`${source}_gap`, 0.003],
    [`${source}_p`, 0.02],
    [`${source}_effect_size`, 1.1],
    [`${source}_q`, 0.04],
  ]),
);

function domain(): DomainData {
  const base = (model: string): Record<string, unknown> => ({
    model: `${model}_consonantal`,
    model_base: model,
    text_variant: "consonantal",
    ...stats,
  });
  return {
    parallelism_overall: MODELS.map(base) as never,
    parallelism_by_type: MODELS.flatMap((m) =>
      PARALLELISM_TYPES.map((scope) => ({ ...base(m), scope })),
    ) as never,
    genre_overall: MODELS.map(base) as never,
    genre_by_genre: MODELS.flatMap((m) =>
      GENRES.map((genre) => ({ ...base(m), genre })),
    ) as never,
    trajectory: MODELS.flatMap((m) =>
      TRAJECTORY_METRICS.map((metric) => ({
        ...base(m),
        metric,
        n_pairs_valid: 11026,
        ...trajectoryStats,
      })),
    ) as never,
    trajectory_by_genre: MODELS.flatMap((m) =>
      TRAJECTORY_METRICS.flatMap((metric) =>
        GENRES.flatMap((genre) =>
          SOURCES.map((source) => ({
            ...base(m),
            metric,
            genre,
            source,
            gap: 0.003,
            p_perm: 0.02,
            perm_q: 0.04,
            maxT_q: 0.9,
          })),
        ),
      ),
    ) as never,
  };
}

const WITH_DATA: FamilyId[] = ["semantic", "lexical", "morphology", "syntax"];

/** The per-genre trajectory rows ship apart from the rest, so the page asks for them separately. */
const loadSlice = (
  family: FamilyId,
  metric: string,
): Promise<DomainData["trajectory_by_genre"]> =>
  Promise.resolve(
    WITH_DATA.includes(family)
      ? domain().trajectory_by_genre.filter((row) => row.metric === metric)
      : [],
  );
const load = (family: FamilyId): Promise<DomainLoad> =>
  Promise.resolve(
    WITH_DATA.includes(family) ? { status: "loaded", data: domain() } : { status: "absent" },
  );

/** No artificial delay: this sweep drives dozens of permutations and only asserts on the result. */
const user = userEvent.setup({ delay: null });

const pill = async (name: string): Promise<void> => {
  await user.click(screen.getByRole("radio", { name }));
};

async function choose(label: string, value: string): Promise<void> {
  await user.selectOptions(screen.getByLabelText(label), value);
}

/** Renders the page and waits for the first family's rows. */
async function open(): Promise<void> {
  cleanup();
  render(<App load={load} loadSlice={loadSlice} />);
  await screen.findByRole("table");
}

/** Every rendered row must have exactly one cell per header, or the two have gone out of step. */
function expectCellsMatchHeaders(context: string): void {
  const headers = screen.getAllByRole("columnheader").length;
  for (const row of screen.getAllByRole("row").slice(1)) {
    expect(within(row).getAllByRole("cell").length, context).toBe(headers);
  }
}

describe("every toolbar permutation renders a coherent table", () => {
  it("keeps headers and cells in step across every parallelism type", async () => {
    await open();
    expectCellsMatchHeaders("parallelism overall");

    for (const type of PARALLELISM_TYPES) {
      await choose("Type", type);
      expectCellsMatchHeaders(`parallelism / ${type}`);
    }
  });

  it("keeps headers and cells in step across every genre", async () => {
    await open();
    await pill("Genre");
    expectCellsMatchHeaders("genre overall");

    for (const genre of GENRES) {
      await choose("Genre", genre);
      expectCellsMatchHeaders(`genre / ${genre}`);
    }
  });

  it("keeps headers and cells in step across every trajectory metric, overall and by genre", async () => {
    await open();
    await pill("Genre");

    for (const metric of TRAJECTORY_METRICS) {
      await choose("Metric", metric);
      expectCellsMatchHeaders(`trajectory / ${metric}`);

      await choose("Genre", "Wisdom");
      await screen.findByRole("columnheader", { name: /source/i });
      expectCellsMatchHeaders(`trajectory / ${metric} / Wisdom`);
      await choose("Genre", "all");
    }
  });

  it("swaps the column set when the metric moves between discrimination and trajectory", async () => {
    await open();
    await pill("Genre");
    await choose("Genre", "Praise");

    await choose("Metric", "structural_distance");
    expect(await screen.findByRole("columnheader", { name: /source/i })).toBeInTheDocument();
    expectCellsMatchHeaders("trajectory / Praise");

    await choose("Metric", "genre");
    expect(screen.queryByRole("columnheader", { name: /source/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /auc 95% ci/i })).toBeInTheDocument();
    expectCellsMatchHeaders("genre / Praise");
  });

  it("shows no rows for a family that was never benchmarked, even after one that was", async () => {
    await open();

    await pill("Phonology");
    expect(
      await screen.findByText(/no benchmark has been run for phonology/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await pill("Discourse");
    expect(
      await screen.findByText(/no benchmark has been run for discourse/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("returns to real rows when a benchmarked family is chosen again", async () => {
    await open();
    await pill("Phonology");
    await screen.findByText(/no benchmark has been run/i);

    await pill("Syntax");
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("asks for the per-genre trajectory rows only when that view is opened", async () => {
    cleanup();
    const slice = vi.fn(loadSlice);
    render(<App load={load} loadSlice={slice} />);
    await screen.findByRole("table");
    expect(slice).not.toHaveBeenCalled();

    await pill("Genre");
    expect(slice).not.toHaveBeenCalled();

    await choose("Metric", "structural_distance");
    expect(slice).not.toHaveBeenCalled();

    await choose("Genre", "Wisdom");
    await screen.findByRole("columnheader", { name: /source/i });
    expect(slice).toHaveBeenCalledWith("semantic", "structural_distance");
  });
});
