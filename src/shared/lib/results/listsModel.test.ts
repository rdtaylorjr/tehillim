import { describe, expect, it } from "vitest";
import { EMPTY_DOMAIN_DATA } from "./domainData";
import type { DomainData } from "./domainData";
import { listsModel } from "./listsModel";

const withRows = (table: string, models: string[]): DomainData => ({
  ...EMPTY_DOMAIN_DATA,
  [table]: models.map((model) => ({ model })),
});

describe("listsModel", () => {
  it("finds a model in the parallelism table", () => {
    expect(listsModel(withRows("parallelism_overall", ["a", "b"]), "b")).toBe(true);
  });

  it("finds a model that only the genre table names", () => {
    expect(listsModel(withRows("genre_overall", ["only_genre"]), "only_genre")).toBe(true);
  });

  it("finds a model that only the trajectory table names", () => {
    expect(listsModel(withRows("trajectory", ["only_traj"]), "only_traj")).toBe(true);
  });

  it("does not find a model the payload never names", () => {
    expect(listsModel(withRows("parallelism_overall", ["a"]), "b")).toBe(false);
  });

  it("is false for an empty payload", () => {
    expect(listsModel(EMPTY_DOMAIN_DATA, "a")).toBe(false);
  });

  it("does not match a partial name", () => {
    expect(listsModel(withRows("parallelism_overall", ["homograph_binary"]), "homograph")).toBe(
      false,
    );
  });
});
