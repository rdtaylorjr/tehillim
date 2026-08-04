"""Integration tests against the real BHSA corpus.

nominal_state is NOT wired into cli.py's shipped `_METHODS` (see
methods.py's docstring): absolute state dominates ~82% of stated words in
nearly every psalm, and with only 2 possible tags TF-IDF's rarity weighting
can't help (both tags carry idf~=1.0 - checked directly). This is the most
degenerate method tried (mean 0.992, std 0.011, 100% of pairs score above
0.9). These tests document that finding as a permanent regression check."""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_nominal_state_matrix_covers_all_150_psalms(nominal_state_features):
    assert nominal_state_features.psalm_numbers == tuple(range(1, 151))


def test_nominal_state_matrix_has_construct_and_absolute_terms(nominal_state_features):
    assert set(nominal_state_features.terms) >= {"c", "a"}


def test_nominal_state_matrix_is_full_150_by_150(nominal_state_result):
    assert nominal_state_result.matrix.shape == (150, 150)


def test_nominal_state_scores_are_bounded(nominal_state_result):
    assert nominal_state_result.matrix.min() >= -1e-9
    assert nominal_state_result.matrix.max() <= 1.0 + 1e-9


def test_nominal_state_scores_are_highly_compressed(nominal_state_result):
    off_diagonal = nominal_state_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.mean() > 0.95
    assert off_diagonal.std() < 0.05
