"""Verb-sense feature extraction.

From the ETCBC/valence companion module (Janet Dyk's verbal-valence
research at VU/ETCBC), `sense` codes the argument-realization pattern of a
specific verb occurrence (e.g. whether it's used with a direct object, a
prepositional complement, or neither) - distinct from `verb_stem`/
`verb_mood`, which describe morphology, not complementation. The dataset
covers valence patterns for a documented subset of verbs, not every verb in
the Hebrew Bible (checked empirically: 3,210 of 5,296 verb occurrences in
the Psalter are tagged, 60.6%, and always exactly on `part_of_speech ==
"verb"` words). Labels here are the raw ETCBC codes: the authoritative
per-code decode table lives in verb-specific flowcharts (the valence
project's wiki), which wasn't accessible to verify against, so no
interpretive gloss is fabricated. This module builds a psalm x sense-code
tag-count FeatureMatrix directly from each word (word-level, no
denormalization needed).
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix


def sensed_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying a verb-sense tag."""
    return [w for w in words if w.verb_sense]


def build_verb_sense_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x verb-sense-code tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in sensed_words(psalm.words):
            tag = word.verb_sense
            counts[tag] = counts.get(tag, 0) + 1
            term_info.setdefault(
                tag,
                FeatureInfo(label=tag, description=word.gloss, category="verb-sense"),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
