"""Turn extracted psalms into numeric feature matrices for comparison.

`FeatureMatrix` is a generic psalm x vocabulary count matrix - it does not
care whether the vocabulary is lexemes, verb-morphology tags, or something
else entirely, which is what lets every "shared vocabulary" style
similarity method (see similarity.py) share one computation. Each concrete
vocabulary gets its own `build_*_feature_matrix` function; this module holds
the first one (lexical, phase 0). Kept independent of Text-Fabric and of any
particular similarity metric, so it can be unit tested with plain data.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from tehillim_pipeline.corpus import Psalm, PsalmWord

#: Part-of-speech codes treated as lexical content words. Closed-class
#: grammatical categories (prepositions, conjunctions, articles, pronouns,
#: negation, interrogatives) are excluded so similarity reflects shared
#: vocabulary rather than shared grammar.
CONTENT_POS = frozenset({"subs", "verb", "nmpr", "adjv", "advb", "intj"})


@dataclass(frozen=True, slots=True)
class FeatureInfo:
    """Display metadata for one column of a FeatureMatrix."""

    label: str
    """Short display form (a Hebrew lemma, a human-readable tag name, ...)."""

    description: str
    """Longer explanation (an English gloss, a tag's full meaning, ...)."""

    category: str
    """Grouping tag (part of speech, feature family, ...)."""


@dataclass(frozen=True, slots=True)
class FeatureMatrix:
    """A dense psalm x term count matrix plus display metadata for each term."""

    psalm_numbers: tuple[int, ...]
    terms: tuple[str, ...]
    counts: np.ndarray  # shape (n_psalms, n_terms), dtype int32
    term_info: dict[str, FeatureInfo]


def content_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` that count as lexical content words."""
    return [w for w in words if w.part_of_speech in CONTENT_POS]


def build_lexical_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x lexeme term-count matrix over content-word lexemes."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in content_words(psalm.words):
            counts[word.lexeme] = counts.get(word.lexeme, 0) + 1
            term_info.setdefault(
                word.lexeme,
                FeatureInfo(
                    label=word.lemma,
                    description=word.gloss,
                    category=word.part_of_speech,
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)


def assemble_feature_matrix(
    psalms: list[Psalm],
    per_psalm_counts: list[dict[str, int]],
    term_info: dict[str, FeatureInfo],
) -> FeatureMatrix:
    """Assemble a FeatureMatrix from per-psalm term counts. Shared by every
    `build_*_feature_matrix` function (see also verb_morphology.py) so the
    matrix-shaping logic (sorting, indexing, dense-array construction) lives
    in exactly one place."""
    terms = tuple(sorted(term_info))
    term_column = {term: i for i, term in enumerate(terms)}

    matrix = np.zeros((len(psalms), len(terms)), dtype=np.int32)
    for row, counts in enumerate(per_psalm_counts):
        for term, count in counts.items():
            matrix[row, term_column[term]] = count

    return FeatureMatrix(
        psalm_numbers=tuple(p.number for p in psalms),
        terms=terms,
        counts=matrix,
        term_info=term_info,
    )
