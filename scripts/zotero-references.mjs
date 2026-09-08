/** Builds public/data/references.json from a copy of the local Zotero library. */
import { DatabaseSync } from "node:sqlite";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

/** The collection whose tree becomes the page, named since ids are machine-local. */
const ROOT_COLLECTION = "Tehillim";
const SOURCE = join(homedir(), "Zotero", "zotero.sqlite");
const OUT = new URL("../public/data/references.json", import.meta.url);
const OUT_BIB = new URL("../public/data/references.bib", import.meta.url);

const scratch = mkdtempSync(join(tmpdir(), "tehillim-zotero-"));
const copy = join(scratch, "zotero.sqlite");
copyFileSync(SOURCE, copy);
const db = new DatabaseSync(copy, { readOnly: true });

const query = (sql, ...params) => db.prepare(sql).all(...params);

/** The top-level collection, by name. */
const roots = query(
  "SELECT collectionID, collectionName FROM collections WHERE collectionName = ? AND parentCollectionID IS NULL",
  ROOT_COLLECTION,
);
const nested = query(
  "SELECT collectionID, collectionName FROM collections WHERE collectionName = ?",
  ROOT_COLLECTION,
);
const root = roots[0] ?? nested[0];
if (!root) throw new Error(`No collection named "${ROOT_COLLECTION}" in ${SOURCE}`);

/** Trashed items are excluded everywhere. */
const trashed = new Set(query("SELECT itemID FROM deletedItems").map((r) => r.itemID));

/** Trashed collections stay in `collections`, so every read filters against this. */
const trashedCollections = new Set(
  query("SELECT collectionID FROM deletedCollections").map((r) => r.collectionID),
);

const fieldRows = query(`
  SELECT d.itemID, f.fieldName, v.value
  FROM itemData d
  JOIN fields f ON f.fieldID = d.fieldID
  JOIN itemDataValues v ON v.valueID = d.valueID
`);
const fieldsByItem = new Map();
for (const row of fieldRows) {
  let bag = fieldsByItem.get(row.itemID);
  if (!bag) {
    bag = {};
    fieldsByItem.set(row.itemID, bag);
  }
  bag[row.fieldName] = String(row.value);
}

const creatorRows = query(`
  SELECT ic.itemID, ic.orderIndex, ct.creatorType, c.firstName, c.lastName
  FROM itemCreators ic
  JOIN creators c ON c.creatorID = ic.creatorID
  JOIN creatorTypes ct ON ct.creatorTypeID = ic.creatorTypeID
  ORDER BY ic.itemID, ic.orderIndex
`);
const creatorsByItem = new Map();
for (const row of creatorRows) {
  //: Editors and translators stand in only where a work has no author.
  const list = creatorsByItem.get(row.itemID) ?? [];
  list.push({
    type: row.creatorType,
    first: row.firstName ?? "",
    last: row.lastName ?? "",
  });
  creatorsByItem.set(row.itemID, list);
}

const typeByItem = new Map(
  query(
    "SELECT i.itemID, t.typeName FROM items i JOIN itemTypes t ON t.itemTypeID = i.itemTypeID",
  ).map((r) => [r.itemID, r.typeName]),
);
const keyByItem = new Map(query("SELECT itemID, key FROM items").map((r) => [r.itemID, r.key]));

/** "Lastname, First" for the first author, "and ..." beyond. */
function formatCreators(list) {
  if (!list || list.length === 0) return "";
  const authors = list.filter((c) => c.type === "author");
  const used = authors.length > 0 ? authors : list.filter((c) => c.type === "editor");
  const chosen = used.length > 0 ? used : list;
  const names = chosen.slice(0, 4).map((c, index) => {
    if (c.first === "") return c.last;
    return index === 0 ? `${c.last}, ${c.first}` : `${c.first} ${c.last}`;
  });
  const suffix = chosen.length > 4 ? ", et al." : "";
  const joined =
    names.length === 1
      ? names[0] + suffix
      : names.length === 2 && suffix === ""
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}${suffix}`;
  //: The full stop closing the author element, unless an initial carries one.
  return joined.endsWith(".") ? joined : `${joined}.`;
}

/** Zotero dates are free text, so only a four-digit year is trusted. */
function yearOf(date) {
  if (!date) return null;
  const match = /\b(1\d{3}|20\d{2})\b/.exec(date);
  return match ? Number(match[1]) : null;
}

/** Zotero's item-type labels, transcribed from its locale files. */
const TYPE_LABELS = {
  artwork: "Artwork",
  audioRecording: "Audio Recording",
  bill: "Bill",
  blogPost: "Blog Post",
  book: "Book",
  bookSection: "Book Section",
  case: "Case",
  computerProgram: "Software",
  conferencePaper: "Conference Paper",
  dataset: "Dataset",
  dictionaryEntry: "Dictionary Entry",
  document: "Document",
  email: "E-mail",
  encyclopediaArticle: "Encyclopedia Article",
  film: "Film",
  forumPost: "Forum Post",
  hearing: "Hearing",
  instantMessage: "Instant Message",
  interview: "Interview",
  journalArticle: "Journal Article",
  letter: "Letter",
  magazineArticle: "Magazine Article",
  manuscript: "Manuscript",
  map: "Map",
  newspaperArticle: "Newspaper Article",
  patent: "Patent",
  podcast: "Podcast",
  preprint: "Preprint",
  presentation: "Presentation",
  radioBroadcast: "Radio Broadcast",
  report: "Report",
  standard: "Standard",
  statute: "Statute",
  thesis: "Thesis",
  tvBroadcast: "TV Broadcast",
  videoRecording: "Video Recording",
  webpage: "Web Page",
};

const typeLabel = (type) =>
  TYPE_LABELS[type] ??
  type.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/** Volume, issue and pages as a citation sets them, each absent part dropping its punctuation. */
function locus(f) {
  const volume =
    f.volume === undefined ? "" : f.issue === undefined ? f.volume : `${f.volume}.${f.issue}`;
  const pages = f.pages ?? "";
  if (pages === "") return volume;
  return volume === "" ? pages : `${volume}: ${pages}`;
}

/** What follows the title: where the work appeared. */
function containerOf(type, f) {
  if (type === "journalArticle" || type === "magazineArticle") return f.publicationTitle ?? "";
  if (type === "bookSection") return f.bookTitle ?? "";
  if (type === "conferencePaper") return f.proceedingsTitle ?? f.publicationTitle ?? "";
  if (type === "thesis") return [f.thesisType, f.university].filter(Boolean).join(", ");
  return f.publisher ?? "";
}

/** A link the browser can follow, with anything else dropped rather than shown dead. */
function webLink(raw) {
  const value = (raw ?? "").trim();
  if (value === "") return "";
  if (/^https?:\/\//i.test(value)) return value;
  // Another scheme entirely (urn:, doi:, ftp:) is not something to link out to.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return "";
  // A bare host, which is what a scheme-less entry almost always is.
  return /^[\w-]+(\.[\w-]+)+(\/|$)/.test(value) ? `https://${value}` : "";
}

/** Zotero's item type as the nearest BibTeX entry type, defaulting to @misc. */
const BIBTEX_TYPES = {
  journalArticle: "article",
  magazineArticle: "article",
  newspaperArticle: "article",
  book: "book",
  bookSection: "incollection",
  conferencePaper: "inproceedings",
  thesis: "phdthesis",
  report: "techreport",
  manuscript: "unpublished",
  preprint: "misc",
  dataset: "misc",
  computerProgram: "misc",
  webpage: "misc",
  presentation: "misc",
};

/** Braces protect capitals and accents from the style, and the rest is escaped. */
function bibValue(value) {
  return String(value ?? "")
    .replace(/[\\{}]/g, "")
    .replace(/([&%$#_])/g, "\\$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** "lastname2019firstword", disambiguated by the Zotero key against collisions. */
function citeKey(itemID, f, creators) {
  const last = (creators?.[0]?.last ?? "anon").toLowerCase().replace(/[^a-z]/g, "");
  const year = yearOf(f.date) ?? "nd";
  const word = (f.title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .find((w) => w.length > 3);
  return [last || "anon", year, word ?? "", keyByItem.get(itemID)?.slice(0, 4).toLowerCase()]
    .filter((part) => part !== "")
    .join("");
}

/** One BibTeX record, carrying what the page shows plus what a manager needs. */
function bibtexFor(itemID) {
  const f = fieldsByItem.get(itemID) ?? {};
  const type = typeByItem.get(itemID) ?? "document";
  const creators = creatorsByItem.get(itemID) ?? [];
  const authors = creators
    .filter((c) => c.type === "author" || c.type === "editor")
    .map((c) => (c.first === "" ? c.last : `${c.last}, ${c.first}`))
    .join(" and ");
  const fields = [
    ["author", authors],
    ["title", f.title],
    ["year", yearOf(f.date)],
    ["journal", type === "journalArticle" ? f.publicationTitle : ""],
    ["booktitle", f.bookTitle ?? (type === "conferencePaper" ? f.proceedingsTitle : "")],
    ["publisher", f.publisher],
    ["school", f.university],
    ["volume", f.volume],
    ["number", f.issue],
    ["pages", f.pages],
    ["address", f.place],
    ["doi", f.DOI],
    ["url", webLink(f.url) || (f.DOI ? `https://doi.org/${f.DOI}` : "")],
  ]
    .map(([name, value]) => [name, bibValue(value)])
    .filter(([, value]) => value !== "");
  const body = fields.map(([name, value]) => `  ${name} = {${value}}`).join(",\n");
  return `@${BIBTEX_TYPES[type] ?? "misc"}{${citeKey(itemID, f, creators)},\n${body}\n}`;
}

/** Standalone works take italics, works inside a container take quotation marks. */
const ITALIC_TITLE_TYPES = new Set([
  "book",
  "dataset",
  "computerProgram",
  "map",
  "artwork",
  "film",
  "videoRecording",
  "audioRecording",
  "report",
]);

/** A chapter or paper is "in" its container, an article merely appeared in one. */
const IN_CONTAINER_TYPES = new Set(["bookSection", "conferencePaper"]);

function entryFor(itemID) {
  const f = fieldsByItem.get(itemID) ?? {};
  const type = typeByItem.get(itemID) ?? "document";
  //: Zotero's URL field wins, since a DOI would replace curated links with redirects.
  const link = webLink(f.url) || (f.DOI ? `https://doi.org/${f.DOI}` : "");
  //: Everything the page prints is composed here, never in the page.
  return {
    id: keyByItem.get(itemID) ?? String(itemID),
    type: typeLabel(type),
    title: f.title ?? "Untitled",
    titleStyle: ITALIC_TITLE_TYPES.has(type) ? "italic" : "quoted",
    containerPrefix: IN_CONTAINER_TYPES.has(type) ? "In " : "",
    creators: formatCreators(creatorsByItem.get(itemID)),
    date: f.date ? f.date.replace(/^\d{4}-\d{2}-\d{2}\s+/, "") : "",
    year: yearOf(f.date),
    container: containerOf(type, f),
    detail: [f.place ?? "", locus(f)].filter((part) => part !== "").join(", "),
    url: link,
  };
}

/** The locale-aware, digit-aware collation Zotero orders its sidebar with. */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** An ordering prefix is scaffolding for the sidebar, so the page shows the name without it. */
const displayName = (name) => name.replace(/^\s*(?:\d{1,2}|[A-Za-z])[.)]\s+/, "");

const childCollections = (id) =>
  query("SELECT collectionID, collectionName FROM collections WHERE parentCollectionID = ?", id)
    .filter((c) => !trashedCollections.has(c.collectionID))
    .sort((a, b) => collator.compare(a.collectionName, b.collectionName));

const itemsIn = (id) =>
  query("SELECT itemID FROM collectionItems WHERE collectionID = ?", id)
    .map((r) => r.itemID)
    .filter((itemID) => !trashed.has(itemID) && typeByItem.has(itemID))
    // Attachments and notes are children of a reference, never references.
    .filter((itemID) => {
      const type = typeByItem.get(itemID);
      return type !== "attachment" && type !== "note" && type !== "annotation";
    });

/** Newest first, then alphabetically inside a year for a stable order. */
function sortEntries(entries) {
  return entries.sort((a, b) => {
    if (a.year !== b.year) {
      if (a.year === null) return 1;
      if (b.year === null) return -1;
      return b.year - a.year;
    }
    return a.title.localeCompare(b.title);
  });
}

/** One top-level collection flattened to named groups, deeper nesting named by path. */
function groupsUnder(collection, prefix) {
  const own = displayName(collection.collectionName);
  const name = prefix === "" ? own : `${prefix} / ${own}`;
  const entries = sortEntries(itemsIn(collection.collectionID).map(entryFor));
  //: A collection whose items all sit in subcollections needs no heading.
  return [
    ...(entries.length === 0 ? [] : [{ name, entries }]),
    ...childCollections(collection.collectionID).flatMap((child) => groupsUnder(child, name)),
  ];
}

function build(collection) {
  //: The section's items head it, already under the section's name.
  const direct = sortEntries(itemsIn(collection.collectionID).map(entryFor));
  return {
    name: displayName(collection.collectionName),
    groups: [
      ...(direct.length === 0 ? [] : [{ name: null, entries: direct }]),
      ...childCollections(collection.collectionID).flatMap((child) => groupsUnder(child, "")),
    ],
  };
}

const sections = childCollections(root.collectionID).map(build);

const count = new Set(
  sections.flatMap((section) => section.groups.flatMap((g) => g.entries.map((e) => e.id))),
).size;

//: Every distinct work, newest first, matching the page's order.
const bibItems = [
  ...new Map(
    sections
      .flatMap((section) => section.groups.flatMap((group) => group.entries))
      .map((entry) => [entry.id, entry]),
  ).values(),
];
const byKey = new Map([...keyByItem.entries()].map(([itemID, key]) => [key, itemID]));
writeFileSync(
  OUT_BIB,
  `% ${String(count)} works from the ${root.collectionName} collection of the project's Zotero library.\n` +
    `% Generated by scripts/zotero-references.mjs - edit the library, not this file.\n\n` +
    bibItems.map((entry) => bibtexFor(byKey.get(entry.id))).join("\n\n") +
    "\n",
);

writeFileSync(
  OUT,
  `${JSON.stringify({ collection: root.collectionName, count, sections }, null, 1)}\n`,
);
db.close();
rmSync(scratch, { recursive: true, force: true });
console.log(
  `Wrote ${String(count)} references in ${String(sections.length)} sections, and references.bib`,
);
