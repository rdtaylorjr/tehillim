"""Phrase-determination feature extraction.

BHSA `det` marks whether a phrase is linguistically determined (`det`,
roughly "definite") or undetermined (`und`). Flagged as a real risk before
building it: with only 2 real categories, this is structurally similar to
`nominal_state.py`, which turned out near-degenerate under TF-IDF-cosine -
kept here for empirical testing, not assumed useful. This module builds a
psalm x phrase-determination tag-count FeatureMatrix, denormalized from
each word's enclosing phrase.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA determination codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/det.md
_DETERMINATION_LABELS: dict[str, str] = {
    "det": "Determined",
    "und": "Undetermined",
}


def determined_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` whose enclosing phrase carries a
    determination tag."""
    return [w for w in words if w.phrase_determination]


def build_phrase_determination_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x phrase-determination tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in determined_words(psalm.words):
            tag = word.phrase_determination
            counts[tag] = counts.get(tag, 0) + 1
            label = _DETERMINATION_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label,
                    description=f"{label} (phrase determination)",
                    category="phrase-determination",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
