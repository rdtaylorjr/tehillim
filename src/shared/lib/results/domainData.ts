import type {
  GenreByGenreRow,
  GenreOverallRow,
  ParallelismByTypeRow,
  ParallelismOverallRow,
  TrajectoryByGenreRow,
  TrajectoryOverallRow,
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
  genre_overall: GenreOverallRow[];
  genre_by_genre: GenreByGenreRow[];
  trajectory: TrajectoryOverallRow[];
  trajectory_by_genre: TrajectoryByGenreRow[];
}

export const EMPTY_DOMAIN_DATA: DomainData = {
  parallelism_overall: [],
  parallelism_by_type: [],
  genre_overall: [],
  genre_by_genre: [],
  trajectory: [],
  trajectory_by_genre: [],
};
