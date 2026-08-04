"""Turn extracted psalms into numeric feature matrices for comparison.

Kept independent of Text-Fabric and of any particular similarity metric, so
it can be unit tested with plain data and reused by future comparison
methods (morphological, syntactic, ...).
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
class LexemeInfo:
    """Display metadata for a lexeme, used to label visualizations."""

    lemma: str
    gloss: str
    part_of_speech: str


@dataclass(frozen=True, slots=True)
class FeatureMatrix:
    """A dense psalm x lexeme term-count matrix plus supporting metadata."""

    psalm_numbers: tuple[int, ...]
    lexemes: tuple[str, ...]
    counts: np.ndarray  # shape (n_psalms, n_lexemes), dtype int32
    lexeme_info: dict[str, LexemeInfo]


def content_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` that count as lexical content words."""
    return [w for w in words if w.part_of_speech in CONTENT_POS]


def build_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x lexeme term-count matrix over content-word lexemes."""
    lexeme_info: dict[str, LexemeInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in content_words(psalm.words):
            counts[word.lexeme] = counts.get(word.lexeme, 0) + 1
            lexeme_info.setdefault(
                word.lexeme,
                LexemeInfo(
                    lemma=word.lemma,
                    gloss=word.gloss,
                    part_of_speech=word.part_of_speech,
                ),
            )
        per_psalm_counts.append(counts)

    lexemes = tuple(sorted(lexeme_info))
    lexeme_column = {lex: i for i, lex in enumerate(lexemes)}

    matrix = np.zeros((len(psalms), len(lexemes)), dtype=np.int32)
    for row, counts in enumerate(per_psalm_counts):
        for lex, count in counts.items():
            matrix[row, lexeme_column[lex]] = count

    return FeatureMatrix(
        psalm_numbers=tuple(p.number for p in psalms),
        lexemes=lexemes,
        counts=matrix,
        lexeme_info=lexeme_info,
    )
