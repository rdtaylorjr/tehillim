"""Grammatical-person feature extraction: a classical form-critical marker
of individual vs. communal address.

Gunkel's successors (Gerstenberger, Westermann) use grammatical person as a
primary diagnostic: individual laments run first-person-singular ("I cried
out"), communal laments first-person-plural ("we"), and hymns lean toward
second-person address to God or third-person description. This module
builds a psalm x (person, number) tag-count FeatureMatrix from two distinct
sources of person marking - a word's own inflectional person (subject
agreement on finite verbs, independent pronouns) and its pronominal suffix
(e.g. the "my" in "my God") - kept as separate tag families since they are
linguistically distinct phenomena that can co-occur on the same word.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA person codes -> human-readable labels.
_PERSON_LABELS: dict[str, str] = {
    "p1": "1st Person",
    "p2": "2nd Person",
    "p3": "3rd Person",
    "unknown": "Person (ambiguous)",
}

#: BHSA number codes -> human-readable labels.
_NUMBER_LABELS: dict[str, str] = {
    "sg": "Singular",
    "pl": "Plural",
    "du": "Dual",
    "unknown": "Number (ambiguous)",
}


def person_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying person marking of either
    kind: the word's own inflectional person, its pronominal suffix's
    person, or both."""
    return [w for w in words if w.person or w.suffix_person]


def _label(person: str, number: str, *, is_suffix: bool) -> str:
    person_label = _PERSON_LABELS.get(person, person)
    number_label = _NUMBER_LABELS.get(number or "unknown", number or "unknown")
    suffix = " Suffix" if is_suffix else ""
    return f"{person_label} {number_label}{suffix}"


def build_person_profile_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x (person, number) tag-count matrix, from both
    word-level and pronominal-suffix person marking."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in person_words(psalm.words):
            if word.person:
                tag = f"word.{word.person}.{word.number or 'unknown'}"
                counts[tag] = counts.get(tag, 0) + 1
                term_info.setdefault(
                    tag,
                    FeatureInfo(
                        label=_label(word.person, word.number, is_suffix=False),
                        description=f"{_label(word.person, word.number, is_suffix=False)} marking",
                        category="grammatical-person",
                    ),
                )
            if word.suffix_person:
                tag = f"suffix.{word.suffix_person}.{word.suffix_number or 'unknown'}"
                counts[tag] = counts.get(tag, 0) + 1
                term_info.setdefault(
                    tag,
                    FeatureInfo(
                        label=_label(word.suffix_person, word.suffix_number, is_suffix=True),
                        description=(
                            f"{_label(word.suffix_person, word.suffix_number, is_suffix=True)} "
                            "(pronominal suffix)"
                        ),
                        category="grammatical-person",
                    ),
                )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
