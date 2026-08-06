"""Group-level statistics over a SimilarityResult, used to validate methods
against ground-truth groupings (see ground_truth.py) rather than only
against individual pairs.

`mean_pairwise_similarity`/`mean_between_group_similarity` report a bare
point estimate. On their own they can't say whether an observed gap (e.g.
"individual laments average 0.87, communal laments average 0.41") reflects
real structure or corpus noise - and the standard tool for that question, a
t-test, does not apply: the pairs inside a group are not independent
observations (each psalm appears in multiple pairs, so its own idiosyncrasy
correlates every pair it's part of - a dyadic/network dependency, the same
issue Mantel tests and QAP address in ecology and social-network analysis).
`permutation_test_cohesion` and `permutation_test_separation` sidestep this
by never assuming independence - only exchangeability under the null (if
the grouping carries no real information, any same-size relabeling of the
corpus is equally likely), which is exactly what a permutation of group
labels tests directly.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

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


@dataclass(frozen=True, slots=True)
class PermutationTestResult:
    """The outcome of a label-permutation significance test."""

    observed: float
    p_value: float
    """One-sided: the fraction of permuted-label draws whose statistic met
    or exceeded the observed one, using Davison & Hinkley's add-one
    smoothing (`(exceedances + 1) / (n_permutations + 1)`) - a permutation
    test can never honestly report exactly 0, since the observed grouping
    is itself one arrangement the null could have produced."""
    n_permutations: int
    null_mean: float
    null_std: float


def permutation_test_cohesion(
    result: SimilarityResult,
    group: Sequence[int],
    *,
    n_permutations: int = 10_000,
    seed: int = 0,
) -> PermutationTestResult:
    """Tests whether `group`'s mean pairwise similarity exceeds what an
    equal-size *random* subset of the whole corpus would produce by chance.

    The null: relabel which psalms count as "the group" uniformly at random
    (same size, drawn from the full corpus) many times, and see how often
    that random group is at least as cohesive as the one actually observed.
    A small p-value means the observed group's cohesion is not explained by
    the corpus's general similarity level alone.
    """
    if len(group) < 2:
        raise ValueError("need at least two psalms to test cohesion")

    index_of = {number: i for i, number in enumerate(result.psalm_numbers)}
    group_indices = np.array([index_of[p] for p in group])
    observed = _mean_similarity_of_indices(result.matrix, group_indices)

    n = len(result.psalm_numbers)
    k = len(group_indices)
    rng = np.random.default_rng(seed)
    null_scores = np.empty(n_permutations)
    for i in range(n_permutations):
        sample = rng.choice(n, size=k, replace=False)
        null_scores[i] = _mean_similarity_of_indices(result.matrix, sample)

    return _summarize(observed, null_scores, n_permutations)


def permutation_test_separation(
    result: SimilarityResult,
    group_a: Sequence[int],
    group_b: Sequence[int],
    *,
    n_permutations: int = 10_000,
    seed: int = 0,
) -> PermutationTestResult:
    """Tests whether `group_a` and `group_b` are more distinct from each
    other than a random resplit of the same pooled psalms would be.

    The statistic is the gap between average within-group similarity and
    average between-group similarity - the same quantity a PERMANOVA
    (permutational multivariate analysis of variance, standard in ecology
    for exactly this "is this a real partition of a distance/similarity
    matrix" question) tests via resplitting. The null: pool `group_a` and
    `group_b` together, randomly resplit into two groups of the same sizes,
    recompute the gap, repeat. A small p-value means the observed split
    captures more real structure than an arbitrary same-size resplit of the
    same psalms would.
    """
    if not group_a or not group_b:
        raise ValueError("both groups must be non-empty")

    index_of = {number: i for i, number in enumerate(result.psalm_numbers)}
    indices_a = np.array([index_of[p] for p in group_a])
    indices_b = np.array([index_of[p] for p in group_b])
    pooled = np.concatenate([indices_a, indices_b])
    size_a = len(indices_a)

    observed = _separation_statistic(result.matrix, indices_a, indices_b)

    rng = np.random.default_rng(seed)
    null_scores = np.empty(n_permutations)
    for i in range(n_permutations):
        shuffled = rng.permutation(pooled)
        null_scores[i] = _separation_statistic(
            result.matrix, shuffled[:size_a], shuffled[size_a:]
        )

    return _summarize(observed, null_scores, n_permutations)


def _mean_similarity_of_indices(matrix: np.ndarray, indices: np.ndarray) -> float:
    """Mean over distinct pairs within `indices` - the same quantity as
    `mean_pairwise_similarity`, but taking positional indices directly
    (rather than psalm numbers needing a lookup) so it's cheap to call
    thousands of times inside a permutation loop."""
    sub = matrix[np.ix_(indices, indices)]
    n = len(indices)
    return float((sub.sum() - n) / (n * (n - 1)))


def _separation_statistic(
    matrix: np.ndarray, indices_a: np.ndarray, indices_b: np.ndarray
) -> float:
    """Average within-group similarity minus average between-group
    similarity. A singleton group contributes 0 to its own within-group
    term (there is no pair to average), rather than dividing by zero - it
    still participates fully in the between-group term."""
    within_a = _mean_similarity_of_indices(matrix, indices_a) if len(indices_a) >= 2 else 0.0
    within_b = _mean_similarity_of_indices(matrix, indices_b) if len(indices_b) >= 2 else 0.0
    between = float(matrix[np.ix_(indices_a, indices_b)].mean())
    return 0.5 * (within_a + within_b) - between


def _summarize(
    observed: float, null_scores: np.ndarray, n_permutations: int
) -> PermutationTestResult:
    exceedances = int(np.sum(null_scores >= observed))
    p_value = (exceedances + 1) / (n_permutations + 1)
    return PermutationTestResult(
        observed=float(observed),
        p_value=float(p_value),
        n_permutations=n_permutations,
        null_mean=float(np.mean(null_scores)),
        null_std=float(np.std(null_scores)),
    )


def benjamini_hochberg(p_values: Sequence[float]) -> tuple[float, ...]:
    """Benjamini-Hochberg FDR-adjusted p-values (the standard step-up
    procedure), controlling the expected proportion of false discoveries
    among whichever values get called significant - the correction this
    project's own exemplar-cohesion battery needs (six tests per signal,
    one per Gunkel genre) rather than reading each p-value as if it were
    the only test run. Order- and length-preserving: `adjusted[i]`
    corresponds to `p_values[i]`. Every adjusted value is >= its raw input
    (correction can only weaken significance, never strengthen it) and
    monotone non-decreasing when read in ascending order of the raw
    p-values, by construction.
    """
    p = np.asarray(p_values, dtype=float)
    n = len(p)
    if n == 0:
        return ()

    order = np.argsort(p)
    ranked = p[order]
    scaled = ranked * n / (np.arange(n) + 1)
    # Step-up: a raw term at rank i can be smaller than one at a higher
    # rank purely from the 1/i factor, not because it's really more
    # significant - taking a running minimum from the largest rank down
    # enforces monotonicity so adjusted significance never decreases as
    # the raw p-value increases.
    adjusted_sorted = np.minimum.accumulate(scaled[::-1])[::-1]
    adjusted_sorted = np.clip(adjusted_sorted, 0.0, 1.0)

    result = np.empty(n)
    result[order] = adjusted_sorted
    return tuple(float(x) for x in result)
