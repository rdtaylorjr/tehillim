"""Named-entity-identity feature extraction.

`named_entity_profile.py` compares psalms by named-entity *type* (person vs.
place vs. people/deity), but that signal is shallow: 75% of type-tagged
words in the Psalter fall into a single category (`pers`), over half of
which is just `JHWH/`. What's actually interesting - whether two psalms
invoke the *same* names (both naming Zion, both naming Jacob/Israel) - lives
in `lexeme`, not `nametype`. It was already sitting inside
`build_lexical_feature_matrix`'s 2198-term vocabulary, diluted among ~2100
common nouns and verbs (99 distinct proper-noun lexemes, checked
empirically). This module isolates that signal: a psalm x lexeme term-count
matrix restricted to proper nouns (`sp == "nmpr"`), following the same shape
as `build_lexical_feature_matrix` and `root_similarity.py`, just filtered to
a different word subset.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix


def proper_noun_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` that are proper nouns."""
    return [w for w in words if w.part_of_speech == "nmpr"]


def build_named_entity_identity_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x proper-noun-lexeme term-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in proper_noun_words(psalm.words):
            counts[word.lexeme] = counts.get(word.lexeme, 0) + 1
            term_info.setdefault(
                word.lexeme,
                FeatureInfo(
                    label=word.lemma,
                    description=word.gloss,
                    category="named-entity-identity",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
