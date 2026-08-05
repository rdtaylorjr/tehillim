"""Integration tests against the real BHSA corpus.

phrase_valence is NOT wired into cli.py's shipped `_METHODS` (see
methods.py's docstring): despite a real 3-way core/complement/adjunct split
with no crushing single-category dominance, it's dense (69% of words
tagged) and only 0.2% of pairs score below 0.5 - density mattered more
than category balance, the same lesson as phrase_function. These tests
document that finding directly as a permanent regression check.
"""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_phrase_valence_matrix_covers_all_150_psalms(phrase_valence_features):
    assert phrase_valence_features.psalm_numbers == tuple(range(1, 151))


def test_phrase_valence_matrix_has_exactly_three_terms(phrase_valence_features):
    assert set(phrase_valence_features.terms) == {"core", "complement", "adjunct"}


def test_phrase_valence_matrix_is_full_150_by_150(phrase_valence_result):
    assert phrase_valence_result.matrix.shape == (150, 150)


def test_phrase_valence_scores_are_bounded(phrase_valence_result):
    assert phrase_valence_result.matrix.min() >= -1e-9
    assert phrase_valence_result.matrix.max() <= 1.0 + 1e-9


def test_phrase_valence_scores_are_highly_compressed(phrase_valence_result):
    off_diagonal = phrase_valence_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.mean() > 0.85
    assert (off_diagonal < 0.5).mean() < 0.05
