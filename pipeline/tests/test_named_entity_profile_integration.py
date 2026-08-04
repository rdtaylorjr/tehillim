"""Integration tests against the real BHSA corpus. See
test_gender_profile_integration.py's docstring for the validation-depth
convention used for these newer feature methods."""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_named_entity_matrix_covers_all_150_psalms(named_entity_features):
    assert named_entity_features.psalm_numbers == tuple(range(1, 151))


def test_named_entity_matrix_has_person_and_place_terms(named_entity_features):
    # Cross-checked against the real value distribution in
    # test_corpus_integration.py (JHWH/ -> pers, YJWN==/ -> topo).
    assert {"pers", "topo"} <= set(named_entity_features.terms)


def test_named_entity_matrix_is_full_150_by_150(named_entity_result):
    assert named_entity_result.matrix.shape == (150, 150)


def test_named_entity_scores_are_bounded(named_entity_result):
    assert named_entity_result.matrix.min() >= -1e-9
    assert named_entity_result.matrix.max() <= 1.0 + 1e-9


def test_named_entity_scores_are_not_degenerate(named_entity_result):
    off_diagonal = named_entity_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.std() > 0.01
