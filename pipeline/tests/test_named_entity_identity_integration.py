"""Integration tests against the real BHSA corpus.

Unlike the type-only `named_entity_profile.py`, this method turned out to
be genuinely discriminative when checked empirically: std=0.326 (the
highest of any newer feature method), 60% of pairs score below 0.5, and
correlation with plain lexical similarity is only 0.322 - a real, distinct
signal, not lexical similarity re-derived. See the analysis that motivated
building this module for the full numbers.
"""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_named_entity_identity_matrix_covers_all_150_psalms(named_entity_identity_features):
    assert named_entity_identity_features.psalm_numbers == tuple(range(1, 151))


def test_named_entity_identity_matrix_has_a_substantial_vocabulary(named_entity_identity_features):
    # Checked empirically: 99 distinct proper-noun lexemes across the Psalter.
    assert 80 <= len(named_entity_identity_features.terms) <= 120


def test_named_entity_identity_includes_the_divine_name(named_entity_identity_features):
    assert "JHWH/" in named_entity_identity_features.terms


def test_named_entity_identity_matrix_is_full_150_by_150(named_entity_identity_result):
    assert named_entity_identity_result.matrix.shape == (150, 150)


def test_named_entity_identity_scores_are_bounded(named_entity_identity_result):
    assert named_entity_identity_result.matrix.min() >= -1e-9
    assert named_entity_identity_result.matrix.max() <= 1.0 + 1e-9


def test_named_entity_identity_scores_are_genuinely_discriminative(named_entity_identity_result):
    # A meaningful bar, not just "not literally constant": a real signal
    # should put a substantial share of pairs clearly below the midpoint.
    off_diagonal = named_entity_identity_result.matrix[~np.eye(150, dtype=bool)]
    assert (off_diagonal < 0.5).mean() > 0.15


def test_named_entity_identity_is_not_a_relabeling_of_lexical_similarity(
    similarity_result, named_entity_identity_result
):
    # It's derived from a subset of the lexical vocabulary, so some
    # correlation is expected - but it should be far from a duplicate.
    n = len(named_entity_identity_result.psalm_numbers)
    iu = np.triu_indices(n, k=1)
    correlation = np.corrcoef(
        similarity_result.matrix[iu], named_entity_identity_result.matrix[iu]
    )[0, 1]
    assert correlation < 0.6


def test_psalm_132_and_psalm_87_both_invoke_zion(named_entity_identity_result):
    # Psalm 132 and 87 are both Zion-centered - a concrete, real check that
    # shared proper nouns actually drive a legible score, not just a
    # vocabulary-size artifact.
    numbers = list(named_entity_identity_result.psalm_numbers)
    score = named_entity_identity_result.matrix[numbers.index(132), numbers.index(87)]
    assert score > 0.1
