export const VERSION = __APP_VERSION__;

export const RELEASE_YEAR = "2026";

const NAME = "Tehillim";
const SCOPE = "Computational Analysis of Psalms";

/** The permanent identity, kept apart from the subtitle a later phase replaces. */
export const SITE = {
  name: NAME,
  scope: SCOPE,
  title: `${NAME} ${SCOPE}`,
  subtitle: "Hebrew Psalm Representation Benchmarks",
} as const;

export const AUTHOR = {
  name: "Rusty Taylor",
  url: "https://github.com/rdtaylorjr",
} as const;

/**
 * Destinations for the footer's acknowledgements. Each resolves through a DOI where the source
 * has one, so the identifier stays canonical. Full citations live in the project README.
 */
export const LINKS = {
  // The DANS DOI is what ETCBC asks you to cite, but it sits behind a wall that denies browsers.
  bhsa: "https://github.com/ETCBC/bhsa",
  textFabric: "https://doi.org/10.5281/zenodo.592193",
  psalmsExplorer: "https://www.logos.com/product/54188/psalms-explorer-dataset",
  repository: "https://github.com/rdtaylorjr/tehillim-react",
} as const;
