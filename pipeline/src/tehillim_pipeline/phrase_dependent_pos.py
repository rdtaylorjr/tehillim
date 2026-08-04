"""Phrase-dependent part-of-speech feature extraction.

BHSA `pdp` reclassifies a word's part-of-speech based on how it functions in
its specific phrase, rather than its lexeme's default category (`sp`) - e.g.
an adjective substantivized to act as a noun, or a noun used adverbially.
Checked empirically: `pdp` differs from `sp` for 1423 of 25372 Psalter words
(5.6%), so this is a real, distinct syntactic-function signal, not a
duplicate of `part_of_speech`. This module builds a psalm x phrase-dependent
part-of-speech tag-count FeatureMatrix from a single tag family.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA phrase-dependent-part-of-speech codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/pdp.md
_PDP_LABELS: dict[str, str] = {
    "art": "Article",
    "verb": "Verb",
    "subs": "Noun",
    "nmpr": "Proper Noun",
    "advb": "Adverb",
    "prep": "Preposition",
    "conj": "Conjunction",
    "prps": "Personal Pronoun",
    "prde": "Demonstrative Pronoun",
    "prin": "Interrogative Pronoun",
    "intj": "Interjection",
    "nega": "Negative Particle",
    "inrg": "Interrogative Particle",
    "adjv": "Adjective",
}


def build_phrase_dependent_pos_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x phrase-dependent-part-of-speech tag-count matrix.
    Unlike most other feature extractors, every word carries a `pdp` value
    (checked empirically), so there is no "words()" filter function."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in psalm.words:
            tag = word.phrase_dependent_pos
            counts[tag] = counts.get(tag, 0) + 1
            label = _PDP_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label,
                    description=f"{label} (phrase-dependent)",
                    category="phrase-dependent-pos",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
