"""Integration tests against the real BHSA corpus. See
test_gender_profile_integration.py's docstring for the validation-depth
convention used for these newer feature methods."""

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


def test_nominal_state_scores_are_not_degenerate(nominal_state_result):
    off_diagonal = nominal_state_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.std() > 0.01
