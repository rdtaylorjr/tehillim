import { renderGenreAlignmentMatrix } from "./genreAlignmentMatrix";
import { isThematicClustering } from "../lib/clusterFamily";
import { renderAlluvialDiagram } from "../viz/alluvialDiagram";
import type { SelectedAlignmentCell } from "../lib/alignmentCell";
import type { GenreAlignment } from "../types";

export interface GenreAlignmentView {
  destroy(): void;
}

/**
 * The Genre Alignment tab's full content: the alluvial diagram first (the
 * primary, self-evident view - see viz/alluvialDiagram.ts), a small
 * purity/AMI/ARI scorecard below it for whoever wants the underlying
 * numbers, and the exact-counts contingency table tucked behind a
 * collapsed `<details>` for whoever wants to audit specific cells. The
 * alluvial leads because the table's entire interpretive burden ("does
 * this genre concentrate into one cluster?") required reading a shading
 * legend and doing the comparison by eye across a row of numbers - the
 * alluvial makes that comparison the geometry itself (ribbon width), no
 * legend required to get the headline read.
 *
 * `clusterMethodId` decides whether a "thematic, not genre" badge is shown
 * (see lib/clusterFamily.ts): a lexical/vocabulary signal's alignment
 * against Gunkel's genres is a coincidence check, not a validated claim,
 * and this view renders identically for both families otherwise - nothing
 * else on screen would tell a viewer which kind of number they're reading.
 */
export function renderGenreAlignmentView(
  container: HTMLElement,
  alignment: GenreAlignment,
  genreColorOf: (genre: string) => string,
  selected: SelectedAlignmentCell | null,
  clusterMethodId: string,
): GenreAlignmentView {
  container.innerHTML = "";

  if (isThematicClustering(clusterMethodId)) {
    container.append(renderThematicBadge());
  }

  const alluvialContainer = document.createElement("div");
  alluvialContainer.className = "alluvial-container";
  container.append(alluvialContainer);
  const alluvial = renderAlluvialDiagram(alluvialContainer, alignment, genreColorOf, selected);

  container.append(renderStatTiles(alignment));

  const details = document.createElement("details");
  details.className = "alignment-detail";
  const summary = document.createElement("summary");
  summary.textContent = "Exact counts";
  details.append(summary);
  const tableContainer = document.createElement("div");
  details.append(tableContainer);
  renderGenreAlignmentMatrix(tableContainer, alignment, selected);
  container.append(details);

  return {
    destroy(): void {
      alluvial.destroy();
    },
  };
}

function renderThematicBadge(): HTMLElement {
  const badge = document.createElement("div");
  badge.className = "caveat-badge";
  badge.textContent =
    "Thematic signal, not genre - this clusters on shared vocabulary, not grammatical form, so the numbers below are a coincidence check against Gunkel's genres, not a validated recovery claim.";
  return badge;
}

function renderStatTiles(alignment: GenreAlignment): HTMLElement {
  const tiles = document.createElement("div");
  tiles.className = "alignment-stat-tiles";

  const stats: [string, number, string][] = [
    ["Purity", alignment.purity, "Share of each cluster taken by its single largest genre."],
    [
      "AMI",
      alignment.ami,
      "Adjusted Mutual Information, corrected for chance agreement: ~0 means this partition is no better than a random one of the same sizes; 1 means an exact match.",
    ],
    [
      "ARI",
      alignment.ari,
      "Adjusted Rand Index: agreement on which psalm pairs are grouped together, corrected for chance.",
    ],
  ];

  for (const [label, value, description] of stats) {
    const tile = document.createElement("div");
    tile.className = "alignment-stat-tile";
    tile.title = description;

    const number = document.createElement("div");
    number.className = "alignment-stat-value";
    number.textContent = value.toFixed(2);

    const caption = document.createElement("div");
    caption.className = "alignment-stat-label";
    caption.textContent = label;

    tile.append(number, caption);
    tiles.append(tile);
  }

  return tiles;
}
