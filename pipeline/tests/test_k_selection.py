from __future__ import annotations

import numpy as np
import pytest

from tehillim_pipeline.k_selection import analyze_k_selection, gap_statistic, subsample_k_stability
from tehillim_pipeline.similarity import SimilarityResult


def _block_similarity(
    n_blocks: int, block_size: int, within: float, between: float
) -> SimilarityResult:
    n = n_blocks * block_size
    matrix = np.full((n, n), between)
    for start in range(0, n, block_size):
        matrix[start : start + block_size, start : start + block_size] = within
    np.fill_diagonal(matrix, 1.0)
    return SimilarityResult(
        method="test", description="test", psalm_numbers=tuple(range(1, n + 1)), matrix=matrix
    )


def _uniform_similarity(n: int, value: float) -> SimilarityResult:
    matrix = np.full((n, n), value)
    np.fill_diagonal(matrix, 1.0)
    return SimilarityResult(
        method="test", description="test", psalm_numbers=tuple(range(1, n + 1)), matrix=matrix
    )


class TestAnalyzeKSelection:
    def test_recovers_the_true_number_of_well_separated_blocks_by_silhouette(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        result = analyze_k_selection(similarity, k_values=range(2, 7))
        assert result.best_k_by_silhouette == 3

    def test_recovers_the_true_number_of_well_separated_blocks_by_eigengap(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        result = analyze_k_selection(similarity, k_values=range(2, 7))
        assert result.best_k_by_eigengap == 3

    def test_result_arrays_align_with_the_requested_k_values(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        k_values = tuple(range(2, 8))
        result = analyze_k_selection(similarity, k_values=k_values)
        assert result.k_values == k_values
        assert len(result.silhouette_scores) == len(k_values)
        assert len(result.eigengaps) == len(k_values)

    def test_silhouette_scores_are_within_valid_bounds(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        result = analyze_k_selection(similarity, k_values=range(2, 7))
        assert all(-1.0 <= score <= 1.0 for score in result.silhouette_scores)

    def test_a_uniform_corpus_has_a_far_weaker_eigengap_signal_than_real_blocks(self):
        # No real cluster structure exists, so every candidate k should be
        # roughly equally (un)supported - the strongest gap should be much
        # smaller than in the genuinely-blocked corpus above.
        blocked = analyze_k_selection(
            _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05),
            k_values=range(2, 7),
        )
        uniform = analyze_k_selection(_uniform_similarity(12, 0.4), k_values=range(2, 7))
        assert max(uniform.eigengaps) < 0.1 * max(blocked.eigengaps)

    def test_best_k_values_are_drawn_from_the_requested_range(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        k_values = range(2, 7)
        result = analyze_k_selection(similarity, k_values=k_values)
        assert result.best_k_by_silhouette in k_values
        assert result.best_k_by_eigengap in k_values

    def test_tolerates_a_similarity_value_that_rounds_slightly_above_one(self):
        # A real cosine-similarity matrix can round to e.g. 1.0000000002
        # for a near-identical pair, making 1 - similarity a tiny negative
        # float - silhouette_score's precomputed-distance check rejects
        # any negative value outright, however small, so this must not
        # propagate uncapped into the distance matrix.
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        similarity.matrix[0, 1] = similarity.matrix[1, 0] = 1.0 + 1e-10
        analyze_k_selection(similarity, k_values=range(2, 5))  # must not raise

    def test_deterministic_across_repeated_calls(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        first = analyze_k_selection(similarity, k_values=range(2, 7))
        second = analyze_k_selection(similarity, k_values=range(2, 7))
        assert first == second


class TestPartitionSignificance:
    def test_flags_a_well_separated_partition_as_significant(self):
        # Three tight, near-identical blocks with almost no between-block
        # similarity - the winning k's partition should trounce essentially
        # every random relabeling of the same distance matrix.
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.95, between=0.05)
        result = analyze_k_selection(
            similarity, k_values=range(2, 7), partition_permutations=1000
        )
        assert result.best_k_by_silhouette == 3
        assert result.partition_p_value < 0.05

    def test_does_not_flag_a_uniform_corpus_as_significant(self):
        # No real structure at all - whichever k silhouette happens to
        # pick, its partition should look just as good as a random
        # relabeling, since every relabeling is equally (un)supported.
        similarity = _uniform_similarity(12, 0.4)
        result = analyze_k_selection(
            similarity, k_values=range(2, 7), partition_permutations=500
        )
        assert result.partition_p_value == pytest.approx(1.0)

    def test_p_value_is_within_valid_bounds(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        result = analyze_k_selection(
            similarity, k_values=range(2, 7), partition_permutations=200
        )
        assert 0.0 < result.partition_p_value <= 1.0

    def test_reproducible_for_a_fixed_seed(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        first = analyze_k_selection(
            similarity, k_values=range(2, 7), partition_permutations=200, seed=7
        )
        second = analyze_k_selection(
            similarity, k_values=range(2, 7), partition_permutations=200, seed=7
        )
        assert first.partition_p_value == second.partition_p_value


class TestSubsampleKStability:
    def test_reports_high_stability_for_strongly_separated_blocks(self):
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.95, between=0.05)
        result = subsample_k_stability(
            similarity, k_values=range(2, 7), n_subsamples=50, seed=0
        )
        assert result.most_stable_k == 3
        assert result.stability > 0.8

    def test_win_counts_sum_to_n_subsamples(self):
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.9, between=0.05)
        result = subsample_k_stability(
            similarity, k_values=range(2, 7), n_subsamples=40, seed=0
        )
        assert sum(result.win_counts) == 40
        assert result.n_subsamples == 40

    def test_win_counts_align_with_k_values(self):
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.9, between=0.05)
        k_values = tuple(range(2, 7))
        result = subsample_k_stability(similarity, k_values=k_values, n_subsamples=30, seed=0)
        assert result.k_values == k_values
        assert len(result.win_counts) == len(k_values)

    def test_stability_matches_the_most_stable_k_win_fraction(self):
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.9, between=0.05)
        result = subsample_k_stability(
            similarity, k_values=range(2, 7), n_subsamples=30, seed=0
        )
        winner_index = result.k_values.index(result.most_stable_k)
        assert result.stability == pytest.approx(result.win_counts[winner_index] / 30)

    def test_most_stable_k_is_drawn_from_the_requested_range(self):
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.9, between=0.05)
        k_values = range(2, 7)
        result = subsample_k_stability(similarity, k_values=k_values, n_subsamples=30, seed=0)
        assert result.most_stable_k in k_values

    def test_reproducible_for_a_fixed_seed(self):
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.9, between=0.05)
        first = subsample_k_stability(similarity, k_values=range(2, 7), n_subsamples=30, seed=3)
        second = subsample_k_stability(similarity, k_values=range(2, 7), n_subsamples=30, seed=3)
        assert first == second

    def test_never_draws_the_same_psalm_twice_in_one_subsample(self, monkeypatch):
        # The whole point of switching away from with-replacement
        # bootstrapping: a duplicated index would make a psalm trivially
        # self-similar (1.0) with itself in the subsampled submatrix, an
        # artifact with no analogue in the real data. `numpy.random.Generator`
        # is an immutable C type (can't patch `.choice` directly on it), so
        # swap in a thin recording wrapper around a real generator instead,
        # in place of the module's own `np.random.default_rng`.
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.9, between=0.05)
        seen_samples: list[np.ndarray] = []
        real_rng = np.random.default_rng(0)

        class RecordingRNG:
            def choice(self, *args, **kwargs):
                result = real_rng.choice(*args, **kwargs)
                seen_samples.append(result)
                return result

        monkeypatch.setattr(
            "tehillim_pipeline.k_selection.np.random.default_rng",
            lambda seed: RecordingRNG(),
        )
        subsample_k_stability(similarity, k_values=range(2, 5), n_subsamples=10, seed=0)

        assert seen_samples, "expected subsample_k_stability to draw without replacement"
        for sample in seen_samples:
            assert len(set(sample.tolist())) == len(sample)

    def test_respects_a_custom_subsample_fraction(self):
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.9, between=0.05)
        result = subsample_k_stability(
            similarity, k_values=range(2, 7), n_subsamples=20, subsample_fraction=0.5, seed=0
        )
        assert sum(result.win_counts) == 20


class TestGapStatistic:
    def test_does_not_select_k1_when_real_block_structure_exists(self):
        # Three tight, well-separated blocks - silhouette already recovers
        # k=3 for structure this clean, so the gap statistic (which CAN
        # select k=1) must not collapse it to "no structure" instead.
        similarity = _block_similarity(n_blocks=3, block_size=5, within=0.95, between=0.05)
        result = gap_statistic(similarity, k_values=range(1, 7), n_references=10, seed=0)
        assert result.best_k > 1

    def test_selects_k1_for_a_corpus_with_no_real_structure(self):
        # The regression case this whole diagnostic exists for: silhouette
        # can never say "no real structure" (undefined at k=1), so it will
        # confidently report some k>=2 for pure noise. The gap statistic
        # must not make the same mistake.
        similarity = _uniform_similarity(12, 0.4)
        result = gap_statistic(similarity, k_values=range(1, 7), n_references=10, seed=0)
        assert result.best_k == 1

    def test_k_values_and_gap_arrays_align(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        k_values = tuple(range(1, 6))
        result = gap_statistic(similarity, k_values=k_values, n_references=5, seed=0)
        assert result.k_values == k_values
        assert len(result.gap) == len(k_values)
        assert len(result.standard_error) == len(k_values)

    def test_best_k_is_drawn_from_the_requested_range(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        k_values = range(1, 6)
        result = gap_statistic(similarity, k_values=k_values, n_references=5, seed=0)
        assert result.best_k in k_values

    def test_reproducible_for_a_fixed_seed(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        first = gap_statistic(similarity, k_values=range(1, 6), n_references=5, seed=7)
        second = gap_statistic(similarity, k_values=range(1, 6), n_references=5, seed=7)
        assert first == second

    def test_standard_errors_are_non_negative(self):
        similarity = _block_similarity(n_blocks=3, block_size=4, within=0.9, between=0.05)
        result = gap_statistic(similarity, k_values=range(1, 6), n_references=5, seed=0)
        assert all(se >= 0.0 for se in result.standard_error)
