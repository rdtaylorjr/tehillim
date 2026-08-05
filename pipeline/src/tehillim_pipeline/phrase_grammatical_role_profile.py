"""Phrase-grammatical-role feature extraction.

From the ETCBC/valence companion module, `grammatical` gives a
finer-grained constituent role than `phrase_function_profile.py`'s generic
Subj/Objc/Cmpl - it distinguishes direct objects, indirect objects, and
several marked-object subtypes (e.g. `L_object`, an object marked with the
ל preposition). Checked empirically: populated on the same ~69%-of-words
pool as `phrase_valence_profile.py`, with 8 real non-empty categories
(`direct_object` most common, then `subject`). Labels here are the raw
ETCBC codes with underscores turned to spaces for readability - no
interpretive gloss is added for the less self-explanatory codes (`L_object`,
`K_object`, `*`), since the authoritative decode table (the valence
project's wiki "Legend" page) wasn't accessible to verify against. This
module builds a psalm x grammatical-role tag-count FeatureMatrix,
denormalized from each word's enclosing phrase.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix


def grammatical_roled_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` whose enclosing phrase carries a
    grammatical-role tag."""
    return [w for w in words if w.phrase_grammatical_role]


def build_phrase_grammatical_role_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x grammatical-role tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in grammatical_roled_words(psalm.words):
            tag = word.phrase_grammatical_role
            counts[tag] = counts.get(tag, 0) + 1
            label = tag.replace("_", " ")
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label,
                    description=f"{label} (grammatical role)",
                    category="grammatical-role",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
