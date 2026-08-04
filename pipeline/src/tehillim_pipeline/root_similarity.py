"""Triliteral-root feature extraction.

BHSA `root` collapses derivationally related lexemes to their shared
consonantal root - e.g. the verb "to meditate" (HGH[) and the noun
"meditation" (HGH/) are distinct `lexeme`s but share the root HGH. This is a
coarser, complementary cousin of lexical similarity (features.py): where
lexical similarity requires the *same word*, root similarity credits shared
thematic vocabulary across parts of speech and derivational forms. Per the
BHSA feature docs this is an experimental, incomplete annotation (only
populated for a subset of words - about a fifth of Psalter word occurrences,
checked empirically), so it is treated as a supplementary signal rather than
a replacement for lexical similarity. This module builds a psalm x root
term-count FeatureMatrix, following the same shape as
`build_lexical_feature_matrix` but keyed on `root` instead of `lexeme`.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix


def rooted_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` with a known triliteral root."""
    return [w for w in words if w.root]


def build_root_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x root term-count matrix over words with a known root."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in rooted_words(psalm.words):
            root = word.root
            counts[root] = counts.get(root, 0) + 1
            term_info.setdefault(
                root,
                FeatureInfo(
                    label=root,
                    description=word.gloss,
                    category="root",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
