"""Integration tests validating verb-morphology similarity against real
Psalter structure.

These assertions were calibrated by first computing the real numbers (not
guessed), so they reflect what the method actually does rather than what
the roadmap hoped it would do. Notably, the broad `GUNKEL_GENRE_EXEMPLARS
["hymn"]` set does NOT show elevated internal cohesion as a whole (mean
0.40, actually *below* the corpus-wide mean of 0.52) - it mixes formally
very different hymn subtypes (a quiet creation hymn like Psalm 8, a mixed
hymn/wisdom composition like Psalm 19, and pure imperative calls-to-praise
like the Final Hallel), and lumping them together washes out the signal.

The imperative-heavy hymnic pattern the roadmap specifically describes
*does* show up clearly - but at the narrower grain of the Final Hallel
(Psalms 146-150), which is the concrete, textually homogeneous case the
hypothesis was actually about. Tests below assert what the data supports:
the narrow case cleanly, and the broad genre categories only where the
numbers back it up. See ground_truth.py's own docstring for why genre
classification is treated this cautiously.
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


# --- Basic sanity, mirroring the lexical method's integration tests -------


def test_similarity_matrix_is_150x150(verb_morphology_result):
    assert verb_morphology_result.matrix.shape == (150, 150)


def test_similarity_matrix_diagonal_is_one(verb_morphology_result):
    assert np.allclose(np.diag(verb_morphology_result.matrix), 1.0)


def test_similarity_matrix_is_symmetric(verb_morphology_result):
    assert np.allclose(verb_morphology_result.matrix, verb_morphology_result.matrix.T)


def test_similarity_scores_bounded(verb_morphology_result):
    assert verb_morphology_result.matrix.min() >= -1e-9
    assert verb_morphology_result.matrix.max() <= 1 + 1e-9


# --- Distinctness from the lexical method ----------------------------------


def test_verb_morphology_similarity_is_not_lexical_similarity_relabeled(
    similarity_result, verb_morphology_result
):
    # Two methods over the same 150 psalms should be genuinely different
    # signals, not the same ranking under a new name - guards against a bug
    # where the "syntactic" extractor accidentally falls back to lexemes.
    n = len(verb_morphology_result.psalm_numbers)
    iu = np.triu_indices(n, k=1)
    correlation = np.corrcoef(similarity_result.matrix[iu], verb_morphology_result.matrix[iu])[
        0, 1
    ]
    assert correlation < 0.5


# --- The Final Hallel: the concrete case the roadmap's hypothesis is about -


def test_psalm_150_is_far_closer_to_its_final_hallel_siblings_than_to_contrasting_psalms(
    verb_morphology_result,
):
    # Psalm 150 is almost entirely "Piel Imperative" (praise!, praise!...).
    # It should closely resemble its fellow Final Hallel psalms and be
    # starkly dissimilar to a stark individual lament (88, almost no
    # imperatives) and a quiet, non-imperative creation hymn (8).
    siblings = [_score(verb_morphology_result, 150, other) for other in (146, 149)]
    contrasts = [_score(verb_morphology_result, 150, other) for other in (88, 8)]

    assert min(siblings) > 0.3
    assert max(contrasts) < 0.1


def test_final_hallel_cluster_exceeds_the_corpus_wide_baseline(verb_morphology_result):
    baseline = _corpus_wide_mean(verb_morphology_result)
    within_hallel = mean_pairwise_similarity(verb_morphology_result, list(gt.HALLEL_FINAL))
    assert within_hallel > baseline


def test_final_hallel_cluster_exceeds_its_similarity_to_lament_exemplars(verb_morphology_result):
    laments = list(gt.GUNKEL_GENRE_EXEMPLARS["individual_lament"]) + list(
        gt.GUNKEL_GENRE_EXEMPLARS["communal_lament"]
    )
    within_hallel = mean_pairwise_similarity(verb_morphology_result, list(gt.HALLEL_FINAL))
    hallel_vs_laments = mean_between_group_similarity(
        verb_morphology_result, list(gt.HALLEL_FINAL), laments
    )
    assert within_hallel > hallel_vs_laments


# --- Coarse genre signal exists somewhere, even if not uniformly ----------


def test_lament_exemplars_cluster_more_tightly_than_the_corpus_wide_baseline(
    verb_morphology_result,
):
    # Individual and communal laments share a narrative, qal-heavy register
    # ("I cried out...", "you have done...") distinct from hymnic address.
    laments = list(gt.GUNKEL_GENRE_EXEMPLARS["individual_lament"]) + list(
        gt.GUNKEL_GENRE_EXEMPLARS["communal_lament"]
    )
    baseline = _corpus_wide_mean(verb_morphology_result)
    within_laments = mean_pairwise_similarity(verb_morphology_result, laments)
    assert within_laments > baseline


def test_at_least_two_genre_categories_show_above_baseline_cohesion(verb_morphology_result):
    # A weak, honest floor: the method should recover *some* coarse genre
    # structure, even though (see module docstring) it does not recover
    # every broad category cleanly.
    baseline = _corpus_wide_mean(verb_morphology_result)
    cohesive = [
        genre
        for genre, exemplars in gt.GUNKEL_GENRE_EXEMPLARS.items()
        if mean_pairwise_similarity(verb_morphology_result, list(exemplars)) > baseline
    ]
    assert len(cohesive) >= 2
