"""Clause-relation feature extraction.

BHSA `rela` (on clauses) marks the syntactic relation of a clause to its
context - e.g. `Coor` coordinated, `Attr` attributive (relative-clause-like),
`Objc` object clause (a full clause serving as a verb's object), `ReVo`
referral to the vocative. Checked empirically: populated on a minority of
clauses (22.5% of Psalter words), with real spread across 11 non-empty
values in the remainder - the same sparse-but-real shape as
`lexical_set.py`. This module builds a psalm x clause-relation tag-count
FeatureMatrix, denormalized from each word's enclosing clause.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA clause-relation codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/rela.md
_CLAUSE_RELATION_LABELS: dict[str, str] = {
    "Adju": "Adjunctive Clause",
    "Attr": "Attributive Clause",
    "Cmpl": "Complement Clause",
    "Coor": "Coordinated Clause",
    "Objc": "Object Clause",
    "PrAd": "Predicative Adjunct Clause",
    "PreC": "Predicative Complement Clause",
    "ReVo": "Referral to the Vocative",
    "Resu": "Resumptive Clause",
    "RgRc": "Regens/Rectum Connection",
    "Spec": "Specification Clause",
    "Subj": "Subject Clause",
}


def clause_related_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` whose enclosing clause carries a
    clause-relation tag."""
    return [w for w in words if w.clause_relation]


def build_clause_relation_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x clause-relation tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in clause_related_words(psalm.words):
            tag = word.clause_relation
            counts[tag] = counts.get(tag, 0) + 1
            label = _CLAUSE_RELATION_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label,
                    description=f"{label} (clause relation)",
                    category="clause-relation",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
