"""Integration tests against the real BHSA corpus.

Structural correctness checks only, per project convention: the deep
"defensible scholarly hypothesis" validation cycle is reserved for the
methods that anchor the genre-fingerprint narrative (verb morphology,
person profile). These newer feature methods still need real-data proof
they work, just not that same depth of scholarly grounding per method.
"""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_gender_profile_matrix_covers_all_150_psalms(gender_profile_features):
    assert gender_profile_features.psalm_numbers == tuple(range(1, 151))


def test_gender_profile_matrix_has_masculine_and_feminine_terms(gender_profile_features):
    assert "word.m" in gender_profile_features.terms
    assert "word.f" in gender_profile_features.terms


def test_gender_profile_matrix_is_full_150_by_150(gender_profile_result):
    assert gender_profile_result.matrix.shape == (150, 150)


def test_gender_profile_scores_are_bounded(gender_profile_result):
    assert gender_profile_result.matrix.min() >= -1e-9
    assert gender_profile_result.matrix.max() <= 1.0 + 1e-9


def test_gender_profile_scores_are_not_degenerate(gender_profile_result):
    # A real, informative similarity metric produces varied off-diagonal
    # scores, not one constant value (which would indicate the feature
    # extraction collapsed to a single trivial term).
    off_diagonal = gender_profile_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.std() > 0.01
