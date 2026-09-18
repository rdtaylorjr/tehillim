import type {
  GenreBaselineRow,
  GenreByGenreRow,
  GenreOverallRow,
  GenreRegister,
  ParallelismByTypeRow,
  ParallelismOverallRow,
} from "./resultRows";

/** Every section's rows share these fields, which is all the filters and the table need. */
export interface ResultRow {
  model?: string;
  model_base?: string;
  text_variant?: string;
  [key: string]: unknown;
}

export interface DomainData {
  parallelism_overall: ParallelismOverallRow[];
  parallelism_by_type: ParallelismByTypeRow[];
  genre_registers: GenreRegister[];
  genre_overall: GenreOverallRow[];
  genre_by_genre: GenreByGenreRow[];
  genre_baseline: GenreBaselineRow[];
}

export const EMPTY_DOMAIN_DATA: DomainData = {
  parallelism_overall: [],
  parallelism_by_type: [],
  genre_registers: [],
  genre_overall: [],
  genre_by_genre: [],
  genre_baseline: [],
};

/** One sliced table's rows as they arrived, keyed so a slower earlier request cannot stand in. */
export interface LoadedSlice {
  readonly key: string;
  readonly table: "genre_by_genre";
  readonly rows: DomainData["genre_by_genre"];
}

/** The family's rows with a slice merged into the table it belongs to, or as they are without one. */
export function withSlice(data: DomainData, slice: LoadedSlice | null): DomainData {
  if (slice === null) return data;
  return { ...data, [slice.table]: slice.rows };
}
