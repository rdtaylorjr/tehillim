"""Integration tests against the real BHSA corpus.

gender_profile is NOT wired into cli.py's shipped `_METHODS` (see
methods.py's docstring): a real analysis run found masculine dominates
~70% of gender-marked words in nearly every psalm, so TF-IDF-cosine over
this profile is structurally near-uniform across the corpus (mean 0.948,
std 0.042, 99% of pairs score above 0.8) - not a bug, a property of the
metric applied to a coarse, one-dominant-category tag family. These tests
document that finding directly as a permanent regression check, rather
than asserting a weak "not literally constant" bar that this method would
pass despite being unusable for psalm comparison.
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


def test_gender_profile_scores_are_highly_compressed(gender_profile_result):
    # Documented finding, not a bug: masculine-dominant tag profiles put
    # nearly every psalm pair in the same narrow high-similarity band.
    off_diagonal = gender_profile_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.mean() > 0.85
    assert off_diagonal.std() < 0.1
