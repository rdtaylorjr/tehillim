import { createSimilarityColorScale } from "../lib/colorScale";
import { topMatches } from "../lib/ranking";
import type { FeatureScore, MethodPayload, PsalmCore } from "../types";

function featureChip(feature: FeatureScore): HTMLElement {
  const chip = document.createElement("span");
  chip.className = "lexeme-chip";

  const label = document.createElement("span");
  label.className = "lemma";
  label.textContent = feature.label;

  const description = document.createElement("span");
  description.textContent = feature.description || feature.category;

  chip.append(label, description);
  return chip;
}

export function renderEmptyDetail(container: HTMLElement): void {
  container.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "detail-empty";
  const p = document.createElement("p");
  p.textContent = "Select a psalm from the grid or the visualization to see its closest matches.";
  empty.append(p);
  container.append(empty);
}

export function renderDetailPanel(
  container: HTMLElement,
  psalms: PsalmCore[],
  method: MethodPayload,
  psalmNumber: number,
  onSelectPsalm: (psalm: number) => void,
): void {
  const psalm = psalms.find((p) => p.number === psalmNumber);
  const stats = method.psalmStats.find((s) => s.number === psalmNumber);
  if (!psalm || !stats) {
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
    statItem(`${psalm.wordCount}`, "words"),
    statItem(`${stats.uniqueTermCount}`, "distinct terms"),
  );

  header.append(number, incipit, statsRow);
  container.append(header);

  if (stats.topTerms.length > 0) {
    const terms = document.createElement("div");
    terms.className = "detail-lexemes";
    for (const term of stats.topTerms.slice(0, 6)) {
      terms.append(featureChip(term));
    }
    container.append(terms);
  }

  const heading = document.createElement("h2");
  heading.className = "similar-heading";
  heading.textContent = "Most similar psalms";
  container.append(heading);

  const matches = topMatches(method, psalmNumber, 10);
  const list = document.createElement("ul");
  list.className = "similar-list";

  const barColor = createSimilarityColorScale(Math.max(matches[0]?.score ?? 0.01, 0.01));

  for (const match of matches) {
    const item = document.createElement("li");
    item.className = "similar-item";
    item.addEventListener("click", () => onSelectPsalm(match.psalm));

    const top = document.createElement("div");
    top.className = "similar-item-top";
    const psalmLabel = document.createElement("span");
    psalmLabel.className = "similar-item-psalm";
    psalmLabel.textContent = `Psalm ${match.psalm}`;
    const scoreLabel = document.createElement("span");
    scoreLabel.className = "similar-item-score";
    scoreLabel.textContent = match.score.toFixed(3);
    top.append(psalmLabel, scoreLabel);

    const barTrack = document.createElement("div");
    barTrack.className = "similar-item-bar-track";
    const barFill = document.createElement("div");
    barFill.className = "similar-item-bar-fill";
    const relativeWidth = (match.score / (matches[0]?.score || 1)) * 100;
    barFill.style.width = `${relativeWidth}%`;
    barFill.style.background = barColor(match.score);
    barTrack.append(barFill);

    const matchPsalm = psalms.find((p) => p.number === match.psalm);
    const incipitLine = document.createElement("p");
    incipitLine.className = "similar-item-incipit";
    incipitLine.textContent = matchPsalm?.incipit ?? "";

    const shared = document.createElement("div");
    shared.className = "similar-item-shared";
    for (const term of match.sharedTerms.slice(0, 4)) {
      shared.append(featureChip(term));
    }

    item.append(top, barTrack, incipitLine, shared);
    list.append(item);
  }

  container.append(list);
}

export function statItem(value: string, label: string): HTMLElement {
  const span = document.createElement("span");
  const b = document.createElement("b");
  b.textContent = value;
  span.append(b, document.createTextNode(` ${label}`));
  return span;
}
