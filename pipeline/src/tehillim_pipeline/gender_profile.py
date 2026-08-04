"""Grammatical-gender feature extraction.

Biblical Hebrew grammatical gender is not purely morphological noise: shifts
between masculine and feminine address/reference (e.g. personified Zion,
Wisdom as a feminine figure, collective feminine nouns for a people) track
rhetorical structure in ways distinct from person or verb morphology. This
module builds a psalm x (gender) tag-count FeatureMatrix from two sources of
gender marking - a word's own inflectional gender and its pronominal
suffix's gender - mirroring person_profile.py's word/suffix split.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA gender codes -> human-readable labels.
_GENDER_LABELS: dict[str, str] = {
    "m": "Masculine",
    "f": "Feminine",
    "unknown": "Gender (ambiguous)",
}


def gender_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying gender marking of either kind:
    the word's own inflectional gender, its pronominal suffix's gender, or
    both."""
    return [w for w in words if w.gender or w.suffix_gender]


def _label(gender: str, *, is_suffix: bool) -> str:
    gender_label = _GENDER_LABELS.get(gender, gender)
    suffix = " Suffix" if is_suffix else ""
    return f"{gender_label}{suffix}"


def build_gender_profile_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x gender tag-count matrix, from both word-level and
    pronominal-suffix gender marking."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in gender_words(psalm.words):
            if word.gender:
                tag = f"word.{word.gender}"
                counts[tag] = counts.get(tag, 0) + 1
                term_info.setdefault(
                    tag,
                    FeatureInfo(
                        label=_label(word.gender, is_suffix=False),
                        description=f"{_label(word.gender, is_suffix=False)} marking",
                        category="grammatical-gender",
                    ),
                )
            if word.suffix_gender:
                tag = f"suffix.{word.suffix_gender}"
                counts[tag] = counts.get(tag, 0) + 1
                term_info.setdefault(
                    tag,
                    FeatureInfo(
                        label=_label(word.suffix_gender, is_suffix=True),
                        description=(
                            f"{_label(word.suffix_gender, is_suffix=True)} (pronominal suffix)"
                        ),
                        category="grammatical-gender",
                    ),
                )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
