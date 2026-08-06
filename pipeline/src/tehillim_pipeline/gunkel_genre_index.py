"""Hermann Gunkel's psalm-by-psalm genre classification, comprehensive
rather than the deliberately small, low-controversy exemplar sets in
`ground_truth.py`'s `GUNKEL_GENRE_EXEMPLARS`. This is the ground truth the
Cluster page's genre-alignment matrix checks each computed clustering
against.

Source and scope
-----------------
There is no single, official, psalm-by-psalm index published by Gunkel
himself - his genre analysis developed across roughly thirty years and
several publications, and the two works cited most often in secondary
literature (his 1930 encyclopedia article, "F", and the 1933 Einleitung in
die Psalmen completed after his death by Joachim Begrich, "E") organize
their discussion by genre, not by psalm number, citing representative
psalms rather than exhaustively classifying all 150. This index inverts
that genre-by-genre discussion into a psalm-ordered table, built primarily
from the 1933 Einleitung (Gunkel's most complete and mature statement),
cross-checked against the 1930 article where the two schemes diverge. It
follows the compilation by Tyler F. Williams (University of Alberta),
drawing on both English translations - the most complete English-language
psalm-by-psalm synthesis available. Citations below (e.g. "E §II.B.1") are
at the section/chapter level, matching how the secondary literature itself
cites the Einleitung.

How ambiguous rows were resolved
---------------------------------
Real scholarly classification is messier than a clean one-genre-per-psalm
table, and forcing every row into that shape without saying so would be
dishonest. Four situations came up, each resolved by an explicit,
consistent rule rather than case-by-case judgment calls:

1. Combined rows (e.g. "9-10", "42-43" - Gunkel treats these as one
   composition split across two psalm numbers): expanded into one entry
   per psalm number, sharing the same genre.
2. Cross-listed "A / B [/ C]" with no hedge on any option: `genre` is the
   first-listed option, `cross_listed=True`. The alignment matrix compares
   against one primary genre per psalm; which of several plausible genres
   is "first" is Gunkel's/Williams' own listing order, not this project's
   judgment.
3. Cross-listed where the first option itself carries an explicit
   "(uncertain)"/parenthetical hedge and a later option does not: `genre`
   is the first *non-hedged* option, `cross_listed=True`, `hedged=True`.
4. A single genre marked "(uncertain)" with no alternative to fall back on:
   kept as the stated genre, `hedged=True`.

Six psalms are excluded entirely (`GUNKEL_EXCLUDED_PSALMS`): Gunkel's own
scheme splits them across genres verse-by-verse (treating them as two
originally independent poems joined editorially) or classifies only a
fragment of the psalm, leaving the rest uncovered. A single whole-psalm
cluster label cannot be honestly compared against a partial or compound
ground truth, so these are left out of `GUNKEL_GENRE_INDEX` rather than
forced into a misleading single bucket. Note this is a *different* set from
`ground_truth.py`'s `ACROSTIC_PSALMS` or `TWIN_PSALMS` - orthogonal textual
facts, not genre judgments.

`hedged` reflects only Gunkel's/Williams' own stated uncertainty, not later
scholarly debate about a classification's placement (e.g. Psalm 139's Hymn
classification is called "one of the more debated assignments in later
reception," but that is a later reception-history judgment, not a hedge
Gunkel himself made - so `hedged=False` there).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class GunkelClassification:
    """One psalm's primary Gunkel genre, per the resolution rules above."""

    psalm: int
    genre: str
    subtype: str | None = None
    cross_listed: bool = False
    hedged: bool = False
    citation: str = ""


#: Canonical genre categories, in the order Gunkel's own Einleitung
#: discusses them (E §I Hymn family through §VI Minor/mixed types).
#: Enthronement Psalm and Song of Zion are kept distinct from Hymn (rather
#: than folded in as subtypes) because Gunkel gives each its own
#: sub-chapter (§I.B, §I.C) - useful genre-alignment granularity that
#: collapsing them into "Hymn" would erase.
#: Grouped by GUNKEL_FAMILIES (each family's genres kept contiguous, in
#: that family's order below) rather than Gunkel's own citation order -
#: so anything that lists genres (this app's legend, its per-genre color
#: scale, the genre-alignment table's rows) reads as "family, then its
#: subtypes" instead of interleaving families.
GUNKEL_GENRES: tuple[str, ...] = (
    "Hymn",
    "Enthronement Psalm",
    "Song of Zion",
    "Individual Lament",
    "Communal Complaint",
    "Confession (National)",
    "Royal Psalm",
    "Individual Thanksgiving",
    "Community Thanksgiving",
    "Wisdom Psalm",
    "Liturgy",
    "Legend / Ancient Story",
    "Mixed Type",
    "Miscellaneous",
)

#: Gunkel's own six top-level chapter families (1933 Einleitung §I-§VI),
#: confirmed against the secondary-literature overview at
#: https://three-things.ca/form-critical-classification-of-psalms/ -
#: `GUNKEL_GENRES` above is a finer decomposition of exactly these six.
GUNKEL_FAMILIES: tuple[str, ...] = (
    "Hymn",
    "Lament",
    "Royal Psalm",
    "Thanksgiving",
    "Wisdom Psalm",
    "Minor/Mixed Types",
)

#: Maps each of the 14 GUNKEL_GENRES to the family (chapter) Gunkel himself
#: filed it under. Three genres are folded into a broader family here even
#: though they don't collapse to an identical name:
#: - Enthronement Psalm, Song of Zion -> Hymn: both are explicit hymn
#:   subtypes (E §I.B, §I.C), not independent chapters.
#: - Individual Thanksgiving, Community Thanksgiving -> Thanksgiving:
#:   E §IV.A/§IV.B, the same chapter's two subtypes.
#: - Communal Complaint -> Lament: E §II.A, sharing a chapter with
#:   Individual Lament (§II.B) under Gunkel's broader "complaint" heading.
#: - Confession (National) -> Lament: both psalms carrying this label (81,
#:   106) cite E §II.B.3, the *individual*-confession section - Williams'
#:   "(national)" flags an atypical communal use of that individual form,
#:   not a separate Gunkel chapter, so there is no real basis for treating
#:   it as its own family.
#: - Liturgy, Legend / Ancient Story, Mixed Type, Miscellaneous ->
#:   Minor/Mixed Types: Gunkel's own catch-all sixth chapter (E §VI).
GENRE_FAMILY: dict[str, str] = {
    "Hymn": "Hymn",
    "Enthronement Psalm": "Hymn",
    "Song of Zion": "Hymn",
    "Individual Lament": "Lament",
    "Communal Complaint": "Lament",
    "Confession (National)": "Lament",
    "Individual Thanksgiving": "Thanksgiving",
    "Community Thanksgiving": "Thanksgiving",
    "Royal Psalm": "Royal Psalm",
    "Wisdom Psalm": "Wisdom Psalm",
    "Liturgy": "Minor/Mixed Types",
    "Legend / Ancient Story": "Minor/Mixed Types",
    "Mixed Type": "Minor/Mixed Types",
    "Miscellaneous": "Minor/Mixed Types",
}

#: Psalms Gunkel's own scheme splits verse-by-verse across genres (treating
#: them as two originally separate poems joined editorially) or classifies
#: only a fragment of - see the module docstring for why these are excluded
#: rather than forced into a single misleading genre.
GUNKEL_EXCLUDED_PSALMS: frozenset[int] = frozenset({27, 40, 66, 89, 96, 144})

GUNKEL_GENRE_INDEX: tuple[GunkelClassification, ...] = (
    GunkelClassification(1, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(2, "Royal Psalm", citation="E §III"),
    GunkelClassification(3, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(4, "Individual Lament", "Psalm of Trust", citation="E §II.B.5"),
    GunkelClassification(5, "Individual Lament", "Protesting Innocence", citation="E §II.B.1-2"),
    GunkelClassification(6, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(7, "Individual Lament", "Protesting Innocence", citation="E §II.B.1-2"),
    GunkelClassification(8, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(9, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(10, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(11, "Individual Lament", "Psalm of Trust", citation="E §II.B.5"),
    GunkelClassification(12, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(13, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(14, "Liturgy", citation="E §VI.C"),
    GunkelClassification(15, "Liturgy", citation="E §VI.C"),
    GunkelClassification(16, "Individual Lament", "Psalm of Trust", citation="E §II.B.5"),
    GunkelClassification(17, "Individual Lament", "Protesting Innocence", citation="E §II.B.1-2"),
    GunkelClassification(
        18, "Royal Psalm", cross_listed=True, citation="E §III, §IV.A (also Ind. Thanksgiving)"
    ),
    GunkelClassification(19, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(
        20, "Royal Psalm", cross_listed=True, citation="E §III, §VI.C (also Liturgy)"
    ),
    GunkelClassification(21, "Royal Psalm", citation="E §III"),
    GunkelClassification(22, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(23, "Individual Lament", "Psalm of Trust", citation="E §II.B.5"),
    GunkelClassification(24, "Liturgy", citation="E §VI.C"),
    GunkelClassification(25, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(26, "Individual Lament", "Protesting Innocence", citation="E §II.B.1-2"),
    # 27 excluded: SPLIT vv.1-6 Trust / vv.7-14 Lament.
    GunkelClassification(28, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(29, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(30, "Individual Thanksgiving", citation="E §IV.A"),
    GunkelClassification(31, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(32, "Individual Thanksgiving", citation="E §IV.A"),
    GunkelClassification(33, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(34, "Individual Thanksgiving", citation="E §IV.A"),
    GunkelClassification(35, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(36, "Miscellaneous", citation="E §VI.D"),
    GunkelClassification(37, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(38, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(39, "Individual Lament", "general", citation="E §II.B.1"),
    # 40 excluded: SPLIT vv.2-12 Thanksgiving / remainder uncovered.
    GunkelClassification(41, "Individual Thanksgiving", citation="E §IV.A"),
    GunkelClassification(42, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(43, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(44, "Communal Complaint", citation="E §II.A"),
    GunkelClassification(45, "Royal Psalm", citation="E §III"),
    GunkelClassification(46, "Song of Zion", citation="E §I.B"),
    GunkelClassification(47, "Enthronement Psalm", citation="E §I.C"),
    GunkelClassification(48, "Song of Zion", citation="E §I.B"),
    GunkelClassification(49, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(50, "Miscellaneous", citation="E §VI.D"),
    GunkelClassification(51, "Individual Lament", "Confession", citation="E §II.B.3"),
    GunkelClassification(52, "Miscellaneous", citation="E §VI.D"),
    GunkelClassification(53, "Liturgy", citation="E §VI.C"),
    GunkelClassification(54, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(55, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(56, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(57, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(58, "Communal Complaint", hedged=True, citation="E §II.A"),
    GunkelClassification(59, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(60, "Communal Complaint", hedged=True, citation="E §II.A"),
    GunkelClassification(61, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(62, "Individual Lament", "Psalm of Trust", citation="E §II.B.5"),
    GunkelClassification(63, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(64, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(65, "Hymn", "general", citation="E §I.A"),
    # 66 excluded: SPLIT/cross-listed across three sections by verse range.
    GunkelClassification(
        67, "Hymn", cross_listed=True, citation="E §I.A, §IV.B (also Community Thanksgiving)"
    ),
    GunkelClassification(68, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(69, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(70, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(71, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(72, "Royal Psalm", citation="E §III"),
    GunkelClassification(73, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(74, "Communal Complaint", citation="E §II.A"),
    GunkelClassification(75, "Miscellaneous", citation="E §VI.D"),
    GunkelClassification(76, "Song of Zion", citation="E §I.B"),
    GunkelClassification(77, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(
        78,
        "Legend / Ancient Story",
        cross_listed=True,
        citation="E §VI.B, §II.B.3 (also Confession, national)",
    ),
    GunkelClassification(79, "Communal Complaint", citation="E §II.A"),
    GunkelClassification(80, "Communal Complaint", citation="E §II.A"),
    GunkelClassification(
        81, "Confession (National)", cross_listed=True, citation="E §II.B.3, §VI.C (also Liturgy)"
    ),
    GunkelClassification(
        82, "Liturgy", cross_listed=True, citation="E §VI.C, §VI.D (also Miscellaneous)"
    ),
    GunkelClassification(83, "Communal Complaint", citation="E §II.A"),
    GunkelClassification(84, "Song of Zion", citation="E §I.B"),
    GunkelClassification(85, "Liturgy", citation="E §VI.C"),
    GunkelClassification(86, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(87, "Song of Zion", citation="E §I.B"),
    GunkelClassification(88, "Individual Lament", "general", citation="E §II.B.1"),
    # 89 excluded: PARTIAL, only vv.47-52 cited (cf. Royal); whole psalm is
    # a mixed royal/communal-lament composition.
    GunkelClassification(90, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(91, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(92, "Individual Thanksgiving", citation="E §IV.A"),
    GunkelClassification(93, "Enthronement Psalm", citation="E §I.C"),
    GunkelClassification(94, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(95, "Liturgy", citation="E §VI.C"),
    # 96 excluded: SPLIT vv.1-9 Hymn / vv.10-13 Enthronement.
    GunkelClassification(97, "Enthronement Psalm", citation="E §I.C"),
    GunkelClassification(98, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(99, "Enthronement Psalm", citation="E §I.C"),
    GunkelClassification(
        100, "Hymn", cross_listed=True, citation="E §I.A, §IV.A (paren., also Ind. Thanksgiving)"
    ),
    GunkelClassification(101, "Royal Psalm", citation="E §III"),
    GunkelClassification(102, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(103, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(104, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(
        105, "Hymn", cross_listed=True, citation="E §I.A, §VI.B (also Legend)"
    ),
    GunkelClassification(
        106,
        "Confession (National)",
        cross_listed=True,
        hedged=True,
        citation="E §II.A (paren., Communal Complaint), §II.B.3, §VI.B (also Legend)",
    ),
    GunkelClassification(
        107,
        "Liturgy",
        cross_listed=True,
        hedged=True,
        citation="E §IV.A (paren., Ind. Thanksgiving), §VI.C",
    ),
    GunkelClassification(108, "Miscellaneous", citation="E §VI.D"),
    GunkelClassification(109, "Individual Lament", "Cursing/Vengeance", citation="E §II.B.1,4"),
    GunkelClassification(110, "Royal Psalm", citation="E §III"),
    GunkelClassification(111, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(112, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(113, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(114, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(115, "Liturgy", citation="E §VI.C"),
    GunkelClassification(116, "Individual Thanksgiving", citation="E §IV.A"),
    GunkelClassification(117, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(
        118, "Individual Thanksgiving", cross_listed=True, citation="E §IV.A, §VI.C (also Liturgy)"
    ),
    GunkelClassification(119, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(120, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(121, "Liturgy", citation="E §VI.C"),
    GunkelClassification(122, "Song of Zion", "Pilgrimage", citation="E §I.B, §VI.A"),
    GunkelClassification(123, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(124, "Community Thanksgiving", citation="E §IV.B"),
    GunkelClassification(
        125,
        "Individual Lament",
        "Psalm of Trust (national)",
        cross_listed=True,
        citation="E §II.B.5, §II.A (paren., also Communal Complaint)",
    ),
    GunkelClassification(126, "Liturgy", citation="E §VI.C"),
    GunkelClassification(127, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(128, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(129, "Community Thanksgiving", citation="E §IV.B"),
    GunkelClassification(130, "Individual Lament", "Confession", citation="E §II.B.1,3"),
    GunkelClassification(131, "Individual Lament", "Psalm of Trust", citation="E §II.B.5"),
    GunkelClassification(
        132, "Royal Psalm", cross_listed=True, citation="E §III, §VI.C (also Liturgy)"
    ),
    GunkelClassification(133, "Wisdom Psalm", citation="E §V"),
    GunkelClassification(134, "Liturgy", citation="E §VI.C"),
    GunkelClassification(135, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(136, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(137, "Mixed Type", citation="E §VI.E"),
    GunkelClassification(138, "Individual Thanksgiving", citation="E §IV.A"),
    GunkelClassification(139, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(140, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(141, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(142, "Individual Lament", "general", citation="E §II.B.1"),
    GunkelClassification(143, "Individual Lament", "general", citation="E §II.B.1"),
    # 144 excluded: PARTIAL, only vv.1-11 cited (cf. Royal); vv.12-15 fall
    # outside Gunkel's cited range.
    GunkelClassification(145, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(146, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(147, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(148, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(149, "Hymn", "general", citation="E §I.A"),
    GunkelClassification(150, "Hymn", "general", citation="E §I.A"),
)


def genre_of(psalm: int) -> str | None:
    """The primary Gunkel genre for `psalm`, or None if excluded/unindexed."""
    for entry in GUNKEL_GENRE_INDEX:
        if entry.psalm == psalm:
            return entry.genre
    return None


def family_of(psalm: int) -> str | None:
    """The Gunkel family (one of `GUNKEL_FAMILIES`) for `psalm`, or None if
    excluded/unindexed."""
    genre = genre_of(psalm)
    return GENRE_FAMILY[genre] if genre is not None else None
