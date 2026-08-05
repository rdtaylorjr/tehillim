"""Clause-type feature extraction.

BHSA `typ` classifies each clause by its constituent pattern (word order +
verb form): e.g. `Way0` wayyiqtol-null (bare narrative "and X did"), `NmCl`
nominal clause (no verb at all), `XImp` X-imperative (a fronted element
before an imperative). This is a much finer-grained decomposition of clause
structure than `verb_morphology.py`'s stem/mood tags alone - it also
encodes word order and null-subject patterns. Checked empirically: always
populated, 40 distinct values occurring in the Psalter. This module builds
a psalm x clause-type tag-count FeatureMatrix, denormalized from each
word's enclosing clause.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA clause-type codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/typ.md
_CLAUSE_TYPE_LABELS: dict[str, str] = {
    "AjCl": "Adjective Clause",
    "CPen": "Casus Pendens",
    "Defc": "Defective Clause Atom",
    "Ellp": "Ellipsis",
    "InfA": "Infinitive Absolute Clause",
    "InfC": "Infinitive Construct Clause",
    "MSyn": "Macrosyntactic Sign",
    "NmCl": "Nominal Clause",
    "Ptcp": "Participle Clause",
    "Reop": "Reopening",
    "Unkn": "Unknown",
    "Voct": "Vocative Clause",
    "Way0": "Wayyiqtol-Null Clause",
    "WayX": "Wayyiqtol-X Clause",
    "WIm0": "We-Imperative-Null Clause",
    "WImX": "We-Imperative-X Clause",
    "WQt0": "We-Qatal-Null Clause",
    "WQtX": "We-Qatal-X Clause",
    "WxI0": "We-X-Imperative-Null Clause",
    "WXIm": "We-X-Imperative Clause",
    "WxIX": "We-X-Imperative-X Clause",
    "WxQ0": "We-X-Qatal-Null Clause",
    "WXQt": "We-X-Qatal Clause",
    "WxQX": "We-X-Qatal-X Clause",
    "WxY0": "We-X-Yiqtol-Null Clause",
    "WXYq": "We-X-Yiqtol Clause",
    "WxYX": "We-X-Yiqtol-X Clause",
    "WYq0": "We-Yiqtol-Null Clause",
    "WYqX": "We-Yiqtol-X Clause",
    "xIm0": "X-Imperative-Null Clause",
    "XImp": "X-Imperative Clause",
    "xImX": "X-Imperative-X Clause",
    "XPos": "Extraposition",
    "xQt0": "X-Qatal-Null Clause",
    "XQtl": "X-Qatal Clause",
    "xQtX": "X-Qatal-X Clause",
    "xYq0": "X-Yiqtol-Null Clause",
    "XYqt": "X-Yiqtol Clause",
    "xYqX": "X-Yiqtol-X Clause",
    "ZIm0": "Zero-Imperative-Null Clause",
    "ZImX": "Zero-Imperative-X Clause",
    "ZQt0": "Zero-Qatal-Null Clause",
    "ZQtX": "Zero-Qatal-X Clause",
    "ZYq0": "Zero-Yiqtol-Null Clause",
    "ZYqX": "Zero-Yiqtol-X Clause",
}


def clause_typed_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying a clause-type tag."""
    return [w for w in words if w.clause_type]


def build_clause_type_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x clause-type tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in clause_typed_words(psalm.words):
            tag = word.clause_type
            counts[tag] = counts.get(tag, 0) + 1
            label = _CLAUSE_TYPE_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label, description=f"{label} (clause type)", category="clause-type"
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
