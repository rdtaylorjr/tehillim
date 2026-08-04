"""Nominal-state feature extraction.

BHSA `st` marks whether a noun (or a nominally-used participle/infinitive)
is in the construct state (bound to a following noun, e.g. "way of the
wicked") or absolute state (unbound). Construct-chain density is a register
marker independent of person, verb morphology, or gender - dense construct
chains are typical of elevated poetic/hymnic diction, while absolute-heavy
text reads more prosaically. This module builds a psalm x state tag-count
FeatureMatrix from a single tag family (no word/suffix split, since state is
not a suffix-bearing feature).
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA state codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/st.md
_STATE_LABELS: dict[str, str] = {
    "a": "Absolute",
    "c": "Construct",
    "e": "Emphatic",
}


def stated_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying a nominal state."""
    return [w for w in words if w.state]


def build_nominal_state_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x nominal-state tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in stated_words(psalm.words):
            tag = word.state
            counts[tag] = counts.get(tag, 0) + 1
            label = _STATE_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label,
                    description=f"{label} state",
                    category="nominal-state",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
