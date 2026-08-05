"""Phrase-function feature extraction.

BHSA `function` (on phrases) marks a phrase's syntactic function: `Pred`
predicate, `Subj` subject, `Objc` object, `Voct` vocative, `Time` time
reference, and 22 others. Checked empirically: always populated, 27
distinct values occurring in the Psalter with the best balance of any
newer feature tried (no single category over ~24%). This module builds a
psalm x phrase-function tag-count FeatureMatrix, denormalized from each
word's enclosing phrase.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA phrase-function codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/function.md
_PHRASE_FUNCTION_LABELS: dict[str, str] = {
    "Adju": "Adjunct",
    "Cmpl": "Complement",
    "Conj": "Conjunction",
    "EPPr": "Enclitic Personal Pronoun",
    "ExsS": "Existence with Subject Suffix",
    "Exst": "Existence",
    "Frnt": "Fronted Element",
    "Intj": "Interjection",
    "IntS": "Interjection with Subject Suffix",
    "Loca": "Locative",
    "Modi": "Modifier",
    "ModS": "Modifier with Subject Suffix",
    "NCop": "Negative Copula",
    "NCoS": "Negative Copula with Subject Suffix",
    "Nega": "Negation",
    "Objc": "Object",
    "PrAd": "Predicative Adjunct",
    "PrcS": "Predicate Complement with Subject Suffix",
    "PreC": "Predicate Complement",
    "Pred": "Predicate",
    "PreO": "Predicate with Object Suffix",
    "PreS": "Predicate with Subject Suffix",
    "PtcO": "Participle with Object Suffix",
    "Ques": "Question",
    "Rela": "Relative",
    "Subj": "Subject",
    "Supp": "Supplementary Constituent",
    "Time": "Time Reference",
    "Unkn": "Unknown",
    "Voct": "Vocative",
}


def build_phrase_function_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x phrase-function tag-count matrix. Every word carries
    a phrase-function value (checked empirically), so there is no
    "words()" filter function."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in psalm.words:
            tag = word.phrase_function
            counts[tag] = counts.get(tag, 0) + 1
            label = _PHRASE_FUNCTION_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label,
                    description=f"{label} (phrase function)",
                    category="phrase-function",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
