import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import type { DomainData } from "../shared/lib/results";
import type { DomainLoad } from "../shared/api";
import { PARALLELISM_TYPES } from "../shared/lib/corpus";
import type { FamilyId } from "../shared/lib/corpus";
import type { LoadedSlice } from "../shared/lib/results";

/** One row per section and register. */
const MODELS = ["alpha", "beta"];
const GENRES = ["Praise", "Wisdom"];
const REGISTERS = [
  { taxonomy: "logos", unit: null, genres: GENRES },
  { taxonomy: "gunkel", unit: "song", genres: ["Hymnus", "Klagelied des Einzelnen"] },
  { taxonomy: "gunkel", unit: "song_component", genres: ["Hymnus", "Danklied"] },
];

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
    genre_registers: REGISTERS,
    genre_overall: MODELS.flatMap((m) =>
      REGISTERS.map(({ taxonomy, unit }) => ({ ...base(m), taxonomy, unit })),
    ) as never,
    genre_by_genre: MODELS.flatMap((m) =>
      REGISTERS.flatMap(({ taxonomy, unit, genres }) =>
        genres.map((genre) => ({ ...base(m), taxonomy, unit, genre })),
      ),
    ) as never,
    genre_baseline: REGISTERS.map(({ taxonomy, unit }) => ({
      taxonomy,
      unit,
      predictor: "shorter_side",
      average_precision: 0.3,
      separation_auc: 0.52,
      prevalence: 0.3,
      n_same_genre: 2791,
      n_different_genre: 8384,
    })),
  };
}

const WITH_DATA: FamilyId[] = ["semantic", "lexical", "morphological", "syntactic"];

/** The per-class rows ship apart from the rest, one file per register, asked for on demand. */
const loadSlice = (
  family: FamilyId,
  _table: LoadedSlice["table"],
  name: string,
): Promise<LoadedSlice["rows"]> => {
  if (!WITH_DATA.includes(family)) return Promise.resolve([]);
  return Promise.resolve(
    domain().genre_by_genre.filter(
      (row) =>
        name === `genre_${row.unit === null ? row.taxonomy : `${row.taxonomy}_${row.unit}`}`,
    ),
  );
};
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

/** Chooses inside one menu, since the model and benchmark menus can both offer a Type. */
async function chooseIn(menu: string, label: string, value: string): Promise<void> {
  await user.selectOptions(within(screen.getByLabelText(menu)).getByLabelText(label), value);
}

/** Renders the page and waits for the first family's rows. */
async function open(): Promise<void> {
  cleanup();
  render(<App load={load} loadSlice={loadSlice} />);
  await screen.findByRole("table");
}

/** Every rendered row must have exactly one cell per header, or the two have gone out of step. */
function expectCellsMatchHeaders(context: string): void {
  const table = document.querySelector("table");
  const headers = table?.querySelectorAll("thead th").length ?? 0;
  const widths = [...(table?.querySelectorAll("tbody tr") ?? [])].map(
    (row) => row.children.length,
  );
  expect(headers, `${context}: no headers`).toBeGreaterThan(0);
  expect(widths, `${context}: no rows`).not.toHaveLength(0);
  expect(new Set(widths), context).toEqual(new Set([headers]));
}

describe("every toolbar permutation renders a coherent table", () => {
  it("keeps headers and cells in step across every parallelism type", async () => {
    await open();
    expectCellsMatchHeaders("parallelism overall");

    for (const type of PARALLELISM_TYPES) {
      await chooseIn("Benchmark", "Type", type);
      expectCellsMatchHeaders(`parallelism / ${type}`);
    }
  });

  it("keeps headers and cells in step across every genre", async () => {
    await open();
    await pill("Genre");
    await choose("Source", "logos");
    expectCellsMatchHeaders("genre overall");

    for (const genre of GENRES) {
      await choose("Genre", genre);
      await screen.findByRole("columnheader", { name: /n same-genre/i });
      expectCellsMatchHeaders(`genre / ${genre}`);
    }
  });

  it("states what length alone scores above the overall rows, and only there", async () => {
    await open();
    await pill("Genre");
    expect(screen.getByText(/^Length alone, shorter side: AUC 0\.5200/)).toBeInTheDocument();

    await choose("Gattung", "Hymnus");
    await screen.findByRole("columnheader", { name: /n same-gattung/i });
    expect(screen.queryByText(/^Length alone/)).not.toBeInTheDocument();
  });

  it("keeps headers and cells in step across every Gunkel unit and Gattung", async () => {
    await open();
    await pill("Genre");
    expectCellsMatchHeaders("gunkel overall");

    for (const register of REGISTERS) {
      if (register.unit === null) continue;
      await choose("Unit", register.unit);
      expectCellsMatchHeaders(`gunkel / ${register.unit}`);
      for (const gattung of register.genres) {
        await choose("Gattung", gattung);
        await screen.findByRole("columnheader", { name: /n same-gattung/i });
        expectCellsMatchHeaders(`gunkel / ${register.unit} / ${gattung}`);
      }
      await choose("Gattung", "all");
    }
  });

  it("swaps the column set when the source moves between Gunkel and Logos", async () => {
    await open();
    await pill("Genre");
    expect(screen.getByRole("columnheader", { name: /n same-gattung/i })).toBeInTheDocument();
    expectCellsMatchHeaders("gunkel overall");

    await choose("Source", "logos");
    expect(
      screen.queryByRole("columnheader", { name: /n same-gattung/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /n same-genre/i })).toBeInTheDocument();
    expectCellsMatchHeaders("logos overall");
  });

  it("shows no rows for a family that was never benchmarked, even after one that was", async () => {
    await open();

    await pill("Phonological");
    expect(
      await screen.findByText(/no benchmark has been run for phonological/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("returns to real rows when a benchmarked family is chosen again", async () => {
    await open();
    await pill("Phonological");
    await screen.findByText(/no benchmark has been run/i);

    await pill("Syntactic");
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("asks for a register's per-class rows only once a class is chosen", async () => {
    cleanup();
    const slice = vi.fn(loadSlice);
    render(<App load={load} loadSlice={slice} />);
    await screen.findByRole("table");
    expect(slice).not.toHaveBeenCalled();
    await pill("Genre");
    await choose("Unit", "song_component");
    expect(slice).not.toHaveBeenCalled();

    await choose("Gattung", "Danklied");
    await screen.findByRole("columnheader", { name: /n same-gattung/i });
    expect(slice).toHaveBeenCalledWith(
      "semantic",
      "genre_by_genre",
      "genre_gunkel_song_component",
    );
  });
});
