"""Verb-morphology feature extraction: a form-critical genre fingerprint.

Gunkel's form-critical genres (hymn, individual lament, communal lament,
thanksgiving, royal, wisdom) are defined by recurring formal patterns -
imperative-heavy calls to praise vs. imperfect/cohortative-heavy petition,
fixed opening/closing formulae - that verb stem (binyan) and mood/
conjugation tags capture directly. This module builds a psalm x
(stem, mood) tag-count FeatureMatrix, the same shape features.py builds for
lexemes, so the same TfidfCosineSimilarity metric applies unchanged.

This is a genre-clustering signal, not a parallel-passage detector: two
psalms can score highly similar here purely by sharing a formal register
(e.g. both being imperative-heavy hymns) despite sharing no vocabulary at
all - that's the intended behavior, not lexical overlap in disguise.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA verb stem (binyan) codes -> human-readable labels.
_STEM_LABELS: dict[str, str] = {
    "qal": "Qal",
    "nif": "Niphal",
    "piel": "Piel",
    "pual": "Pual",
    "hif": "Hiphil",
    "hof": "Hophal",
    "hit": "Hitpael",
    "hsht": "Hishtaphel",
    "etpa": "Etpaal",
    "poel": "Poel",
}

#: BHSA verb conjugation/mood codes -> human-readable labels.
_MOOD_LABELS: dict[str, str] = {
    "perf": "Perfect",
    "impf": "Imperfect",
    "wayq": "Wayyiqtol",
    "impv": "Imperative",
    "infc": "Infinitive Construct",
    "infa": "Infinitive Absolute",
    "ptca": "Active Participle",
    "ptcp": "Passive Participle",
}


def verb_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` usable for verb-morphology features:
    verbs with both a stem and a mood recorded."""
    return [w for w in words if w.part_of_speech == "verb" and w.verb_stem and w.verb_mood]


def _tag(word: PsalmWord) -> str:
    return f"{word.verb_stem}.{word.verb_mood}"


def _label(tag: str) -> str:
    stem, mood = tag.split(".", 1)
    return f"{_STEM_LABELS.get(stem, stem)} {_MOOD_LABELS.get(mood, mood)}"


def build_verb_morphology_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x (verb stem, mood) tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in verb_words(psalm.words):
            tag = _tag(word)
            counts[tag] = counts.get(tag, 0) + 1
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=_label(tag),
                    description=f"{_label(tag)} verb form",
                    category="verb-morphology",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
