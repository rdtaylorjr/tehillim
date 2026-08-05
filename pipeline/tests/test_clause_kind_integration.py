"""Integration tests against the real BHSA corpus.

clause_kind is NOT wired into cli.py's shipped `_METHODS` (see methods.py's
docstring): only 3 categories, dense (100% of words tagged), 0% of pairs
score below 0.5 - the same degenerate shape as nominal_state. These tests
document that finding directly as a permanent regression check.
"""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_clause_kind_matrix_covers_all_150_psalms(clause_kind_features):
    assert clause_kind_features.psalm_numbers == tuple(range(1, 151))


def test_clause_kind_matrix_has_exactly_three_terms(clause_kind_features):
    assert set(clause_kind_features.terms) == {"VC", "NC", "WP"}


def test_clause_kind_matrix_is_full_150_by_150(clause_kind_result):
    assert clause_kind_result.matrix.shape == (150, 150)


def test_clause_kind_scores_are_bounded(clause_kind_result):
    assert clause_kind_result.matrix.min() >= -1e-9
    assert clause_kind_result.matrix.max() <= 1.0 + 1e-9


def test_clause_kind_scores_are_highly_compressed(clause_kind_result):
    off_diagonal = clause_kind_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.mean() > 0.9
    assert (off_diagonal < 0.5).mean() < 0.05
