from __future__ import annotations

import numpy as np
import pytest

from tehillim_pipeline.analysis import mean_between_group_similarity, mean_pairwise_similarity
from tehillim_pipeline.similarity import SimilarityResult


def _result(matrix: list[list[float]], psalm_numbers: tuple[int, ...]) -> SimilarityResult:
    return SimilarityResult(
        method="test",
        description="test",
        psalm_numbers=psalm_numbers,
        matrix=np.array(matrix),
    )


class TestMeanPairwiseSimilarity:
    def test_averages_every_off_diagonal_pair_within_the_group(self):
        result = _result(
            [
                [1.0, 0.2, 0.4],
                [0.2, 1.0, 0.6],
                [0.4, 0.6, 1.0],
            ],
            psalm_numbers=(1, 2, 3),
        )
        # pairs: (1,2)=0.2, (1,3)=0.4, (2,3)=0.6 -> mean 0.4
        assert mean_pairwise_similarity(result, [1, 2, 3]) == pytest.approx(0.4)

    def test_ignores_psalms_outside_the_requested_group(self):
        result = _result(
            [
                [1.0, 0.9, 0.1],
                [0.9, 1.0, 0.1],
                [0.1, 0.1, 1.0],
            ],
            psalm_numbers=(1, 2, 3),
        )
        assert mean_pairwise_similarity(result, [1, 2]) == pytest.approx(0.9)

    def test_does_not_depend_on_argument_order(self):
        result = _result(
            [[1.0, 0.3], [0.3, 1.0]],
            psalm_numbers=(1, 2),
        )
        assert mean_pairwise_similarity(result, [1, 2]) == mean_pairwise_similarity(result, [2, 1])

    def test_raises_for_a_single_psalm(self):
        result = _result([[1.0]], psalm_numbers=(1,))
        with pytest.raises(ValueError, match="at least two"):
            mean_pairwise_similarity(result, [1])

    def test_raises_for_an_empty_group(self):
        result = _result([[1.0]], psalm_numbers=(1,))
        with pytest.raises(ValueError, match="at least two"):
            mean_pairwise_similarity(result, [])


class TestMeanBetweenGroupSimilarity:
    def test_averages_every_cross_group_pair(self):
        result = _result(
            [
                [1.0, 0.2, 0.4, 0.6],
                [0.2, 1.0, 0.1, 0.3],
                [0.4, 0.1, 1.0, 0.5],
                [0.6, 0.3, 0.5, 1.0],
            ],
            psalm_numbers=(1, 2, 3, 4),
        )
        # group_a={1,2}, group_b={3,4}
        # pairs: (1,3)=0.4 (1,4)=0.6 (2,3)=0.1 (2,4)=0.3 -> mean 0.35
        assert mean_between_group_similarity(result, [1, 2], [3, 4]) == pytest.approx(0.35)

    def test_disjoint_groups_ignore_within_group_pairs(self):
        result = _result(
            [
                [1.0, 0.99, 0.0],
                [0.99, 1.0, 0.0],
                [0.0, 0.0, 1.0],
            ],
            psalm_numbers=(1, 2, 3),
        )
        # The 0.99 within {1,2} must not leak into the cross-group average.
        assert mean_between_group_similarity(result, [1, 2], [3]) == pytest.approx(0.0)

    def test_raises_for_an_empty_group(self):
        result = _result([[1.0, 0.5], [0.5, 1.0]], psalm_numbers=(1, 2))
        with pytest.raises(ValueError, match="non-empty"):
            mean_between_group_similarity(result, [], [1])
