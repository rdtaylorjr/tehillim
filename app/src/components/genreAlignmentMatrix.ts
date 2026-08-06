import { computeShare, isDarkCell, isSelectedCell, type SelectedAlignmentCell } from "../lib/alignmentCell";
import { createAlignmentColorScale } from "../lib/colorScale";
import { orderClustersByGenre } from "../lib/clusterColumnOrder";
import type { GenreAlignment } from "../types";

/**
 * Renders a genre x cluster contingency table: how many of each Gunkel
 * genre's psalms this clustering placed in each cluster. Columns are
 * reordered and captioned by `clusterGenreLabels` - the cluster-to-genre
 * assignment that maximizes total overlap (the Hungarian algorithm; see
 * pipeline/genre_alignment.py) - so a column reads "Cluster 5, best match:
 * Enthronement Psalm" instead of a bare, meaningless index number. Cell
 * shade is the row-normalized share (what fraction of that genre landed in
 * that cluster) - a legend strip under the score summary spells out the
 * light-to-dark mapping directly, rather than leaving it to be inferred.
 * A summary line reports purity, Adjusted Mutual Information, and the
 * Adjusted Rand Index - external validation scores that, unlike the column
 * labels, don't depend on any particular cluster-to-genre assignment, so
 * they're the defensible numbers for "how well does this signal actually
 * recover Gunkel's genres." AMI, not plain NMI: NMI has no chance
 * correction and biases upward with many small/uneven categories (exactly
 * this data's shape - 14 genres, some with a single member).
 *
 * `alignment` is caller-supplied (rather than always reading
 * `method.genreAlignment`) so the same renderer draws either the 14-genre
 * or the 6-family cross-tab, matching whichever granularity the shared
 * Books/Gunkel picker dropdown currently has selected.
 *
 * This is the exact-counts detail view, tucked behind a `<details>` toggle
 * by `components/genreAlignmentView.ts` - the alluvial diagram is the
 * primary view now, so purity/AMI/ARI are rendered once, up front, by that
 * caller rather than repeated here.
 */
export function renderGenreAlignmentMatrix(
  container: HTMLElement,
  alignment: GenreAlignment,
  selected: SelectedAlignmentCell | null,
): void {
  container.innerHTML = "";

  const cellColor = createAlignmentColorScale();
  const columnOrder = orderClustersByGenre(alignment.clusterGenreLabels, alignment.genres);

  container.append(renderShadeLegend(cellColor));

  const table = document.createElement("table");
  table.className = "alignment-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.className = "alignment-corner";
  corner.textContent = "Category";
  corner.title = "Each row is a Gunkel genre or family; each column is one of this signal's clusters.";
  headerRow.append(corner);
  for (const clusterIndex of columnOrder) {
    const matchedGenre = alignment.clusterGenreLabels[clusterIndex];
    const th = document.createElement("th");
    th.className = "alignment-cluster-header";
    th.title = matchedGenre
      ? `Cluster ${clusterIndex + 1}. Best matches "${matchedGenre}"`
      : `Cluster ${clusterIndex + 1}. No genre matched strongly enough`;

    const numberLine = document.createElement("div");
    numberLine.className = "alignment-cluster-number";
    numberLine.textContent = `Cluster ${clusterIndex + 1}`;

    const genreLine = document.createElement("div");
    genreLine.className = "alignment-cluster-genre";
    genreLine.textContent = matchedGenre ? `best match: ${matchedGenre}` : "no strong match";

    th.append(numberLine, genreLine);
    headerRow.append(th);
  }
  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  alignment.genres.forEach((genre, genreIndex) => {
    const total = alignment.genreTotals[genreIndex];
    const counts = alignment.counts[genreIndex];

    const row = document.createElement("tr");

    const rowHeader = document.createElement("th");
    rowHeader.scope = "row";
    rowHeader.className = "alignment-row-header";
    const nameSpan = document.createElement("span");
    nameSpan.className = "alignment-genre-name";
    nameSpan.textContent = genre;
    const totalSpan = document.createElement("span");
    totalSpan.className = "alignment-genre-total";
    totalSpan.textContent = `${total} psalms`;
    rowHeader.append(nameSpan, totalSpan);
    row.append(rowHeader);

    for (const clusterIndex of columnOrder) {
      const count = counts[clusterIndex];
      const cell = document.createElement("td");
      const share = computeShare(count, total);
      cell.style.background = cellColor(share);
      if (count > 0) {
        cell.textContent = `${count}`;
        cell.title = `${count} of ${total} ${genre} psalms in Cluster ${clusterIndex + 1} (${Math.round(share * 100)}%)`;
        if (isDarkCell(share)) {
          cell.classList.add("is-dark");
        }
      }
      if (isSelectedCell(genre, clusterIndex, selected)) {
        cell.classList.add("is-selected-cell");
      }
      row.append(cell);
    }

    tbody.append(row);
  });
  table.append(tbody);

  container.append(table);
}

//: Spells out what the table's two visual channels mean right next to the
//: table itself - a caption above the table (outside this component) said
//: the same thing in prose, but that turned out to be easy to miss once
//: looking at the actual grid of numbers and shaded cells.
function renderShadeLegend(cellColor: (share: number) => string): HTMLElement {
  const legend = document.createElement("div");
  legend.className = "alignment-legend";

  const numberNote = document.createElement("span");
  numberNote.className = "alignment-legend-note";
  numberNote.textContent = "Number = psalm count in that genre × cluster cell.";
  legend.append(numberNote);

  const shadeNote = document.createElement("span");
  shadeNote.className = "alignment-legend-shade";

  const loLabel = document.createElement("span");
  loLabel.textContent = "0%";
  const bar = document.createElement("span");
  bar.className = "alignment-legend-bar";
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const stop = document.createElement("span");
    stop.style.background = cellColor(i / steps);
    bar.append(stop);
  }
  const hiLabel = document.createElement("span");
  hiLabel.textContent = "100%";
  const caption = document.createElement("span");
  caption.textContent = "of the genre's psalms in that cluster (darker = more concentrated)";

  shadeNote.append(loLabel, bar, hiLabel, caption);
  legend.append(shadeNote);

  return legend;
}
