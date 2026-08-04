"""Lexical-set feature extraction.

BHSA `ls` subclassifies part-of-speech beyond `sp` - e.g. flagging a noun
used as a preposition (`ppre`) or adverb (`padv`), a verb used as a copula
(`vbcp`), or a cardinal/ordinal/multiplicative numeral. Only a minority of
Psalter words carry a lexical set (most are "none", normalized to "" by
corpus.py), but the ones that do mark exactly the kind of grammaticalized,
semantically-bleached function word usage that tends to cluster by register
(numerals in genealogical/didactic material, focus particles in emphatic
poetry, ...). This module builds a psalm x lexical-set tag-count
FeatureMatrix from a single tag family.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA lexical-set codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/ls.md
_LEXICAL_SET_LABELS: dict[str, str] = {
    "nmdi": "Distributive Noun",
    "nmcp": "Copulative Noun",
    "padv": "Potential Adverb",
    "afad": "Anaphoric Adverb",
    "ppre": "Potential Preposition",
    "cjad": "Conjunctive Adverb",
    "ordn": "Ordinal",
    "vbcp": "Copulative Verb",
    "mult": "Noun of Multitude",
    "focp": "Focus Particle",
    "ques": "Interrogative Particle",
    "gntl": "Gentilic",
    "quot": "Quotation Verb",
    "card": "Cardinal",
}


def lexical_set_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying a lexical-set subcategory."""
    return [w for w in words if w.lexical_set]


def build_lexical_set_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x lexical-set tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in lexical_set_words(psalm.words):
            tag = word.lexical_set
            counts[tag] = counts.get(tag, 0) + 1
            label = _LEXICAL_SET_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label,
                    description=f"{label} ({tag})",
                    category="lexical-set",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
