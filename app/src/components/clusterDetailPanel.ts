import type { ClusterMethodPayload, PsalmCore } from "../types";
import { renderEmptyDetail, statItem } from "./detailPanel";

export { renderEmptyDetail };

/** The Genre page's counterpart to detailPanel.ts's renderDetailPanel: no
 * ranked-by-score matches (clustering is a partition, not a similarity
 * ranking) - instead, every other psalm sharing this psalm's cluster. */
export function renderClusterDetailPanel(
  container: HTMLElement,
  psalms: PsalmCore[],
  method: ClusterMethodPayload,
  psalmNumber: number,
  onSelectPsalm: (psalm: number) => void,
): void {
  const psalm = psalms.find((p) => p.number === psalmNumber);
  const clusterIndex = method.assignments[String(psalmNumber)];
  const cluster = method.clusters.find((c) => c.index === clusterIndex);
  if (!psalm || !cluster) {
    renderEmptyDetail(container);
    return;
  }

  container.innerHTML = "";

  const header = document.createElement("div");
  header.className = "detail-header";

  const number = document.createElement("div");
  number.className = "detail-number";
  number.textContent = `Psalm ${psalm.number}`;

  const incipit = document.createElement("p");
  incipit.className = "detail-incipit";
  incipit.textContent = psalm.incipit;

  const statsRow = document.createElement("div");
  statsRow.className = "detail-stats";
  statsRow.append(
    statItem(`${psalm.verseCount}`, "verses"),
    statItem(`Cluster ${cluster.index + 1}`, ""),
    statItem(`${cluster.size}`, "psalms in cluster"),
  );

  header.append(number, incipit, statsRow);
  container.append(header);

  const heading = document.createElement("h2");
  heading.className = "similar-heading";
  heading.textContent = `Cluster ${cluster.index + 1} members`;
  container.append(heading);

  const list = document.createElement("ul");
  list.className = "similar-list";

  const otherMembers = cluster.psalmNumbers.filter((number) => number !== psalmNumber);

  for (const memberNumber of otherMembers) {
    const item = document.createElement("li");
    item.className = "similar-item";
    item.addEventListener("click", () => onSelectPsalm(memberNumber));

    const top = document.createElement("div");
    top.className = "similar-item-top";
    const psalmLabel = document.createElement("span");
    psalmLabel.className = "similar-item-psalm";
    psalmLabel.textContent = `Psalm ${memberNumber}`;
    top.append(psalmLabel);

    const memberPsalm = psalms.find((p) => p.number === memberNumber);
    const incipitLine = document.createElement("p");
    incipitLine.className = "similar-item-incipit";
    incipitLine.textContent = memberPsalm?.incipit ?? "";

    item.append(top, incipitLine);
    list.append(item);
  }

  container.append(list);
}
