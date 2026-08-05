"""Phrase-valence feature extraction.

From the ETCBC/valence companion module (Janet Dyk's verbal-valence
research at VU/ETCBC, part of the SYNVAR project - not core BHSA), `valence`
classifies each phrase as a verbal argument: `core` (a required argument of
the verb), `complement`, or `adjunct` (a peripheral, optional constituent).
Checked empirically: 69% of Psalter words fall inside an annotated phrase,
with a real 3-way split (core 40%, complement 21%, adjunct 7% of all
words) - no crushing single-category dominance. This module builds a psalm
x valence tag-count FeatureMatrix, denormalized from each word's enclosing
phrase.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: ETCBC/valence codes -> human-readable labels.
_VALENCE_LABELS: dict[str, str] = {
    "core": "Core Argument",
    "complement": "Complement",
    "adjunct": "Adjunct",
}


def valenced_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` whose enclosing phrase carries a
    valence tag."""
    return [w for w in words if w.phrase_valence]


def build_phrase_valence_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x phrase-valence tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in valenced_words(psalm.words):
            tag = word.phrase_valence
            counts[tag] = counts.get(tag, 0) + 1
            label = _VALENCE_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label, description=f"{label} (verbal valence)", category="phrase-valence"
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
