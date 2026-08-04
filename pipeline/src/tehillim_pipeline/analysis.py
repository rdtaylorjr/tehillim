"""Group-level statistics over a SimilarityResult, used to validate methods
against ground-truth groupings (see ground_truth.py) rather than only
against individual pairs.
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np

from tehillim_pipeline.similarity import SimilarityResult


def mean_pairwise_similarity(result: SimilarityResult, psalm_numbers: Sequence[int]) -> float:
    """Mean similarity across every distinct pair within `psalm_numbers`."""
    if len(psalm_numbers) < 2:
        raise ValueError("need at least two psalms to compute pairwise similarity")

    indices = _indices_for(result, psalm_numbers)
    scores = [
        result.matrix[i, j] for a, i in enumerate(indices) for b, j in enumerate(indices) if a < b
    ]
    return float(np.mean(scores))


def mean_between_group_similarity(
    result: SimilarityResult, group_a: Sequence[int], group_b: Sequence[int]
) -> float:
    """Mean similarity between every psalm in `group_a` and every psalm in
    `group_b` (within-group pairs in either group are not included)."""
    if not group_a or not group_b:
        raise ValueError("both groups must be non-empty")

    indices_a = _indices_for(result, group_a)
    indices_b = _indices_for(result, group_b)
    scores = [result.matrix[i, j] for i in indices_a for j in indices_b]
    return float(np.mean(scores))


def _indices_for(result: SimilarityResult, psalm_numbers: Sequence[int]) -> list[int]:
    numbers = list(result.psalm_numbers)
    return [numbers.index(p) for p in psalm_numbers]
