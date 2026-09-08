export const VERSION = __APP_VERSION__;

export const RELEASE_YEAR = "2026";

const NAME = "Tehillim";
/** The Hebrew name, unpointed as it is cited rather than as it is read. */
const NAME_HE = "תהלים";
const SCOPE = "Computational Analysis of Hebrew Psalms";

/** The permanent identity, `scope` heading the landing page. */
export const SITE = {
  name: NAME,
  nameHebrew: NAME_HE,
  scope: SCOPE,
  title: `${NAME} · ${SCOPE}`,
  subtitle: "Hebrew Psalms Representation Benchmarks",
} as const;

export const AUTHOR = {
  name: "Rusty Taylor",
  url: "https://github.com/rdtaylorjr",
} as const;

/** Footer acknowledgement links, resolving through a DOI where the source has one. */
export const LINKS = {
  // The BHSA licence requires attribution through this identifier specifically.
  bhsa: "https://doi.org/10.17026/dans-z6y-skyh",
  textFabric: "https://doi.org/10.5281/zenodo.592193",
  psalmsExplorer: "https://www.logos.com/product/54188/psalms-explorer-dataset",
  repository: "https://github.com/rdtaylorjr/tehillim",
} as const;
