"""Integration tests against the real BHSA corpus. See
test_gender_profile_integration.py's docstring for the validation-depth
convention used for these newer feature methods."""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_phrase_dependent_pos_matrix_covers_all_150_psalms(phrase_dependent_pos_features):
    assert phrase_dependent_pos_features.psalm_numbers == tuple(range(1, 151))


def test_phrase_dependent_pos_matrix_has_the_core_pos_terms(phrase_dependent_pos_features):
    assert set(phrase_dependent_pos_features.terms) >= {"subs", "verb", "prep", "conj"}


def test_phrase_dependent_pos_matrix_is_full_150_by_150(phrase_dependent_pos_result):
    assert phrase_dependent_pos_result.matrix.shape == (150, 150)


def test_phrase_dependent_pos_scores_are_bounded(phrase_dependent_pos_result):
    assert phrase_dependent_pos_result.matrix.min() >= -1e-9
    assert phrase_dependent_pos_result.matrix.max() <= 1.0 + 1e-9


def test_phrase_dependent_pos_scores_are_not_degenerate(phrase_dependent_pos_result):
    off_diagonal = phrase_dependent_pos_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.std() > 0.01
