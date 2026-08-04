from __future__ import annotations

import numpy as np
import pytest

from tehillim_pipeline.features import FeatureMatrix, LexemeInfo
from tehillim_pipeline.similarity import LexicalTfidfCosine, tfidf_weights


def _features(counts: list[list[int]], lexemes: tuple[str, ...]) -> FeatureMatrix:
    info = {lex: LexemeInfo(lemma=lex, gloss="", part_of_speech="subs") for lex in lexemes}
    return FeatureMatrix(
        psalm_numbers=tuple(range(1, len(counts) + 1)),
        lexemes=lexemes,
        counts=np.array(counts, dtype=np.int32),
        lexeme_info=info,
    )


def test_identical_psalms_have_similarity_one():
    fm = _features([[3, 1, 0], [3, 1, 0], [0, 0, 5]], lexemes=("A", "B", "C"))
    result = LexicalTfidfCosine().compute(fm)
    assert result.matrix[0, 1] == pytest.approx(1.0, abs=1e-9)


def test_disjoint_vocabulary_has_similarity_zero():
    fm = _features([[5, 0], [0, 5]], lexemes=("A", "B"))
    result = LexicalTfidfCosine().compute(fm)
    assert result.matrix[0, 1] == pytest.approx(0.0, abs=1e-9)


def test_diagonal_is_exactly_one():
    fm = _features([[1, 2], [3, 0], [0, 4]], lexemes=("A", "B"))
    result = LexicalTfidfCosine().compute(fm)
    assert np.allclose(np.diag(result.matrix), 1.0)


def test_matrix_is_symmetric():
    fm = _features([[1, 2, 3], [0, 5, 1], [2, 2, 2]], lexemes=("A", "B", "C"))
    result = LexicalTfidfCosine().compute(fm)
    assert np.allclose(result.matrix, result.matrix.T)


def test_similarity_scores_bounded_between_zero_and_one():
    fm = _features([[1, 0, 4], [0, 3, 1], [2, 2, 0], [5, 0, 0]], lexemes=("A", "B", "C"))
    result = LexicalTfidfCosine().compute(fm)
    assert result.matrix.min() >= -1e-9
    assert result.matrix.max() <= 1 + 1e-9


def test_ubiquitous_lexeme_is_downweighted_relative_to_rare_one():
    # "A" appears in every psalm (uninformative); "B" only occurs in psalms 1-2.
    fm = _features([[1, 3], [1, 3], [1, 0], [1, 0]], lexemes=("A", "B"))
    weights = tfidf_weights(fm)
    assert weights[0, 1] > weights[0, 0]


def test_zero_count_lexeme_gets_zero_weight():
    fm = _features([[5, 0], [0, 5]], lexemes=("A", "B"))
    weights = tfidf_weights(fm)
    assert weights[0, 1] == 0.0
    assert weights[1, 0] == 0.0


def test_result_preserves_psalm_numbers_and_method_metadata():
    fm = _features([[1, 0], [0, 1]], lexemes=("A", "B"))
    result = LexicalTfidfCosine().compute(fm)
    assert result.psalm_numbers == fm.psalm_numbers
    assert result.method == "lexical-tfidf-cosine"
    assert "TF-IDF" in result.description
