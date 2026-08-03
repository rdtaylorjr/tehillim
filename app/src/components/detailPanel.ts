import { createSimilarityColorScale } from "../lib/colorScale";
import { topMatches } from "../lib/ranking";
import type { LexemeScore, SimilarityPayload } from "../types";

function lexemeChip(lex: LexemeScore): HTMLElement {
  const chip = document.createElement("span");
  chip.className = "lexeme-chip";

  const lemma = document.createElement("span");
  lemma.className = "lemma";
  lemma.textContent = lex.lemma;

  const gloss = document.createElement("span");
  gloss.textContent = lex.gloss || lex.pos;

  chip.append(lemma, gloss);
  return chip;
}

export function renderEmptyDetail(container: HTMLElement): void {
  container.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "detail-empty";
  const p = document.createElement("p");
  p.textContent =
    "Select a psalm from the grid or the visualization to see its closest lexical matches.";
  empty.append(p);
  container.append(empty);
}

export function renderDetailPanel(
  container: HTMLElement,
  data: SimilarityPayload,
  psalmNumber: number,
  onSelectPsalm: (psalm: number) => void,
): void {
  const psalm = data.psalms.find((p) => p.number === psalmNumber);
  if (!psalm) {
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

  const stats = document.createElement("div");
  stats.className = "detail-stats";
  stats.append(
    statItem(`${psalm.verseCount}`, "verses"),
    statItem(`${psalm.wordCount}`, "words"),
    statItem(`${psalm.uniqueLexemeCount}`, "distinct lexemes"),
  );

  header.append(number, incipit, stats);
  container.append(header);

  if (psalm.topLexemes.length > 0) {
    const lexemes = document.createElement("div");
    lexemes.className = "detail-lexemes";
    for (const lex of psalm.topLexemes.slice(0, 6)) {
      lexemes.append(lexemeChip(lex));
    }
    container.append(lexemes);
  }

  const heading = document.createElement("h2");
  heading.className = "similar-heading";
  heading.textContent = "Most similar psalms";
  container.append(heading);

  const matches = topMatches(data, psalmNumber, 10);
  const list = document.createElement("ul");
  list.className = "similar-list";

  const barColor = createSimilarityColorScale(
    Math.max(matches[0]?.score ?? 0.01, 0.01),
  );

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

    const matchPsalm = data.psalms.find((p) => p.number === match.psalm);
    const incipitLine = document.createElement("p");
    incipitLine.className = "similar-item-incipit";
    incipitLine.textContent = matchPsalm?.incipit ?? "";

    const shared = document.createElement("div");
    shared.className = "similar-item-shared";
    for (const lex of match.sharedLexemes.slice(0, 4)) {
      shared.append(lexemeChip(lex));
    }

    item.append(top, barTrack, incipitLine, shared);
    list.append(item);
  }

  container.append(list);
}

function statItem(value: string, label: string): HTMLElement {
  const span = document.createElement("span");
  const b = document.createElement("b");
  b.textContent = value;
  span.append(b, document.createTextNode(` ${label}`));
  return span;
}
