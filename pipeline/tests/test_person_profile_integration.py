"""Integration tests validating grammatical-person similarity against real
Psalter structure.

Calibrated against the real computed numbers first (see the analysis run
during development), not asserted from hope. The individual/communal
lament distinction turns out to separate unusually cleanly on this
signal - individual laments (Ps 3, 22, 38, 51, 88) score 0.87 with each
other on average, communal laments (Ps 44, 74, 79, 80, 137) score 0.73
with each other, and the two groups score only 0.41 with *each other* -
below the 0.51 corpus-wide baseline. That's a stronger separation than
verb-morphology's Final Hallel result, and the concrete pair-level numbers
below are pulled directly from that same real run.
"""

from __future__ import annotations

import numpy as np
import pytest

from tehillim_pipeline import ground_truth as gt
from tehillim_pipeline.analysis import mean_between_group_similarity, mean_pairwise_similarity

pytestmark = pytest.mark.integration


def _corpus_wide_mean(result) -> float:
    n = len(result.psalm_numbers)
    iu = np.triu_indices(n, k=1)
    return float(np.mean(result.matrix[iu]))


def _score(result, psalm_a: int, psalm_b: int) -> float:
    numbers = list(result.psalm_numbers)
    return float(result.matrix[numbers.index(psalm_a), numbers.index(psalm_b)])


# --- Basic sanity, mirroring the other methods' integration tests --------


def test_similarity_matrix_is_150x150(person_profile_result):
    assert person_profile_result.matrix.shape == (150, 150)


def test_similarity_matrix_diagonal_is_one(person_profile_result):
    assert np.allclose(np.diag(person_profile_result.matrix), 1.0)


def test_similarity_matrix_is_symmetric(person_profile_result):
    assert np.allclose(person_profile_result.matrix, person_profile_result.matrix.T)


def test_similarity_scores_bounded(person_profile_result):
    assert person_profile_result.matrix.min() >= -1e-9
    assert person_profile_result.matrix.max() <= 1 + 1e-9


def test_person_profile_similarity_is_not_a_relabeling_of_other_methods(
    similarity_result, verb_morphology_result, person_profile_result
):
    n = len(person_profile_result.psalm_numbers)
    iu = np.triu_indices(n, k=1)
    lexical_corr = np.corrcoef(similarity_result.matrix[iu], person_profile_result.matrix[iu])[
        0, 1
    ]
    verb_corr = np.corrcoef(verb_morphology_result.matrix[iu], person_profile_result.matrix[iu])[
        0, 1
    ]
    assert lexical_corr < 0.5
    assert verb_corr < 0.5


# --- Individual vs. communal lament: the concrete, well-motivated case ---


def test_individual_laments_are_far_closer_to_each_other_than_to_communal_laments(
    person_profile_result,
):
    individual = list(gt.GUNKEL_GENRE_EXEMPLARS["individual_lament"])
    communal = list(gt.GUNKEL_GENRE_EXEMPLARS["communal_lament"])

    within_individual = mean_pairwise_similarity(person_profile_result, individual)
    cross = mean_between_group_similarity(person_profile_result, individual, communal)
    assert within_individual > cross + 0.3


def test_communal_laments_are_far_closer_to_each_other_than_to_individual_laments(
    person_profile_result,
):
    individual = list(gt.GUNKEL_GENRE_EXEMPLARS["individual_lament"])
    communal = list(gt.GUNKEL_GENRE_EXEMPLARS["communal_lament"])

    within_communal = mean_pairwise_similarity(person_profile_result, communal)
    cross = mean_between_group_similarity(person_profile_result, individual, communal)
    assert within_communal > cross + 0.2


def test_individual_and_communal_laments_are_less_alike_than_the_corpus_baseline(
    person_profile_result,
):
    # A striking, clean finding: an individual lament and a communal
    # lament are LESS similar on grammatical person than two random
    # psalms - the "I" vs "we" distinction is a real anti-correlation,
    # not just a weak signal.
    individual = list(gt.GUNKEL_GENRE_EXEMPLARS["individual_lament"])
    communal = list(gt.GUNKEL_GENRE_EXEMPLARS["communal_lament"])
    baseline = _corpus_wide_mean(person_profile_result)
    cross = mean_between_group_similarity(person_profile_result, individual, communal)
    assert cross < baseline


def test_psalm_22_scores_far_higher_with_individual_laments_than_communal_laments(
    person_profile_result,
):
    # Psalm 22 ("My God, my God, why have you forsaken me") against two
    # other individual laments vs. two communal laments.
    individual_scores = [_score(person_profile_result, 22, other) for other in (88, 38)]
    communal_scores = [_score(person_profile_result, 22, other) for other in (44, 137)]
    assert min(individual_scores) > 0.7
    assert max(communal_scores) < 0.5
