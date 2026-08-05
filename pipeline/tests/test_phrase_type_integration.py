"""Integration tests against the real BHSA corpus.

phrase_type is NOT wired into cli.py's shipped `_METHODS` (see methods.py's
docstring): dense (100% of words tagged), 0% of pairs score below 0.5 -
the same failure mode as phrase_dependent_pos despite 13 categories. These
tests document that finding directly as a permanent regression check.
"""

from __future__ import annotations

import numpy as np
import pytest

pytestmark = pytest.mark.integration


def test_phrase_type_matrix_covers_all_150_psalms(phrase_type_features):
    assert phrase_type_features.psalm_numbers == tuple(range(1, 151))


def test_phrase_type_matrix_has_a_rich_but_still_compressed_vocabulary(phrase_type_features):
    assert len(phrase_type_features.terms) >= 10


def test_phrase_type_matrix_is_full_150_by_150(phrase_type_result):
    assert phrase_type_result.matrix.shape == (150, 150)


def test_phrase_type_scores_are_bounded(phrase_type_result):
    assert phrase_type_result.matrix.min() >= -1e-9
    assert phrase_type_result.matrix.max() <= 1.0 + 1e-9


def test_phrase_type_scores_are_highly_compressed(phrase_type_result):
    off_diagonal = phrase_type_result.matrix[~np.eye(150, dtype=bool)]
    assert off_diagonal.mean() > 0.85
    assert (off_diagonal < 0.5).mean() < 0.05
