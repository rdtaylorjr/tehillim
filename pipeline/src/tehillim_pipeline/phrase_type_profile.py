"""Phrase-type feature extraction.

BHSA `typ` (on phrases) classifies each phrase by its internal makeup: `VP`
verbal phrase, `NP` nominal phrase, `PP` prepositional phrase, `PrNP`
proper-noun phrase, and 9 others. Checked empirically: always populated, 13
distinct values, better balanced than `phrase_dependent_pos.py`'s
part-of-speech mix (top category ~30% here vs. ~36% there) - but the same
failure mode (every psalm needs verb phrases and noun phrases regardless of
genre) is a real risk, so this is built for empirical testing, not assumed
useful. This module builds a psalm x phrase-type tag-count FeatureMatrix,
denormalized from each word's enclosing phrase.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA phrase-type codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/typ.md
_PHRASE_TYPE_LABELS: dict[str, str] = {
    "VP": "Verbal Phrase",
    "NP": "Nominal Phrase",
    "PrNP": "Proper-Noun Phrase",
    "AdvP": "Adverbial Phrase",
    "PP": "Prepositional Phrase",
    "CP": "Conjunctive Phrase",
    "PPrP": "Personal Pronoun Phrase",
    "DPrP": "Demonstrative Pronoun Phrase",
    "IPrP": "Interrogative Pronoun Phrase",
    "InjP": "Interjectional Phrase",
    "NegP": "Negative Phrase",
    "InrP": "Interrogative Phrase",
    "AdjP": "Adjective Phrase",
}


def build_phrase_type_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x phrase-type tag-count matrix. Every word carries a
    phrase-type value (checked empirically), so there is no "words()"
    filter function."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in psalm.words:
            tag = word.phrase_type
            counts[tag] = counts.get(tag, 0) + 1
            label = _PHRASE_TYPE_LABELS.get(tag, tag)
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=label, description=f"{label} (phrase type)", category="phrase-type"
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
