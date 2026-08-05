"""Clause-kind feature extraction.

BHSA `kind` is a coarse, three-way clause classification derived from
`typ`: `VC` verbal, `NC` nominal, `WP` without predication. A much blunter
instrument than `clause_type_profile.py`'s full 36-way breakdown - included
anyway since a coarse aggregate can carry a different signal than its fine
decomposition (the same logic as keeping both `sp` and `ls`). Flagged as a
real risk: with only 3 categories, this is structurally similar to
`nominal_state.py` and `phrase_dependent_pos.py`, both of which turned out
to be near-degenerate under TF-IDF-cosine - kept here for empirical testing,
not assumed useful. This module builds a psalm x clause-kind tag-count
FeatureMatrix, denormalized from each word's enclosing clause.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA clause-kind codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/kind.md
_CLAUSE_KIND_LABELS: dict[str, str] = {
    "VC": "Verbal Clause",
    "NC": "Nominal Clause",
    "WP": "Clause Without Predication",
}


def clause_kinded_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying a clause-kind tag."""
    return [w for w in words if w.clause_kind]


def build_clause_kind_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x clause-kind tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in clause_kinded_words(psalm.words):
            tag = word.clause_kind
            counts[tag] = counts.get(tag, 0) + 1
            label = _CLAUSE_KIND_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label, description=f"{label} (clause kind)", category="clause-kind"
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
