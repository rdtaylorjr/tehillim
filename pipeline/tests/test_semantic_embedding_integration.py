"""Integration sanity check against real BHSA half-verses and a real
MiqraBERT download - validates the embedding pipeline behaves sanely on
real text before trusting it for the actual genre question, the same
"check against known ground truth before moving on" discipline every other
method in this project follows (see e.g. test_verb_morphology_integration.py).

Deliberately scoped to a handful of psalms, not the full 150 x both
encoders x both aggregations sweep - that full run (used to produce the
real numbers reported in the README) lives in a one-off analysis script,
not the routine test suite, since it downloads and runs two transformer
models over the whole corpus.
"""

from __future__ import annotations

import pytest

from tehillim_pipeline.semantic_embedding import (
    MIQRABERT_MODEL,
    compute_half_verse_embeddings,
    mean_pool_similarity,
    soft_alignment_similarity,
)

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def sample_embeddings(psalms):
    # Psalm 14/53: the near-identical twin pair (ground_truth.py's
    # TWIN_PSALMS). Psalm 8 and 88: an uncontested hymn and an uncontested
    # individual lament, sharing essentially no wording with the twins or
    # each other - a concrete, checkable negative control.
    sample = [p for p in psalms if p.number in (14, 53, 8, 88)]
    return compute_half_verse_embeddings(sample, MIQRABERT_MODEL)


def _score(result, a: int, b: int) -> float:
    numbers = list(result.psalm_numbers)
    return float(result.matrix[numbers.index(a), numbers.index(b)])


def test_twin_psalms_score_far_higher_than_unrelated_psalms(sample_embeddings):
    for similarity_fn in (mean_pool_similarity, soft_alignment_similarity):
        result = similarity_fn(sample_embeddings)
        twins = _score(result, 14, 53)
        unrelated = [
            _score(result, 14, 8),
            _score(result, 14, 88),
            _score(result, 53, 8),
            _score(result, 53, 88),
            _score(result, 8, 88),
        ]
        assert twins > max(unrelated)


def test_soft_alignment_and_mean_pool_are_not_the_same_signal_on_real_text(sample_embeddings):
    # Guards against a bug where soft-alignment accidentally degenerates
    # to mean-pooling (e.g. always taking the first/only best match) - the
    # two should give genuinely different numbers on real, multi-half-verse
    # psalms, not just in the synthetic unit tests.
    mean_pool = mean_pool_similarity(sample_embeddings)
    soft_alignment = soft_alignment_similarity(sample_embeddings)
    assert mean_pool.matrix[0, 1] != pytest.approx(soft_alignment.matrix[0, 1])
