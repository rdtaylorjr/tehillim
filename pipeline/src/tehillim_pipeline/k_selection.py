"""Diagnostics for choosing the number of clusters (k) from the data,
rather than assuming it from Gunkel's traditional genre count.

`cluster_methods.py` used to fix `n_clusters=6` for every shipped signal,
matching Gunkel's six major form-critical genres - a number chosen by
analogy to his category count, not by anything about the data. The two
independent, standard techniques below checked whether 6 was actually
data-preferred for a given similarity matrix, found that it wasn't for
either validated genre-fingerprint signal, and are now wired directly into
`cluster_methods.py` via `clustering.data_driven_k` - every shipped
method picks its own k from its own data rather than sharing one borrowed
from Gunkel's genre count:

1. Silhouette score: for each candidate k, run the same spectral
   clustering the shipped methods use, then score how well-separated the
   resulting partition is (mean, over points, of `(b - a) / max(a, b)`
   where `a` is a point's mean distance to its own cluster and `b` to the
   nearest other cluster). Higher is a better-supported k - and unlike
   purity/AMI/ARI (genre_alignment.py), this needs no external label at
   all, so it can't be biased by how well a clustering happens to line up
   with Gunkel's categories.
2. Eigengap: the normalized graph Laplacian of a well-clustered affinity
   matrix has approximately as many near-zero eigenvalues as there are
   real clusters, with a sharp jump (gap) to the next eigenvalue - the
   classical heuristic for choosing k in spectral clustering (von Luxburg,
   "A Tutorial on Spectral Clustering," 2007).
3. Gap statistic (Tibshirani, Walther & Hastie, 2001): compares the real
   data's within-cluster dispersion at each k against the same quantity
   for reference matrices with no structure by construction (random
   permutations of the real matrix's own off-diagonal values). Unlike
   silhouette, which is undefined at k=1 and therefore can never report
   "no real structure here," the gap statistic can and does select k=1 -
   see `gap_statistic`.

Silhouette (gated by the gap statistic - see `clustering.data_driven_k`)
is what the shipped `k_selector` actually uses: the gap statistic is
checked first for every signal, and only once it confirms real structure
exists does silhouette pick which k above 1. Eigengap is also computed
here and reported in the top-level README's methodology notes, but
plugging it directly into `cluster_methods.py` as an alternative selector
is not yet done.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from sklearn.cluster import SpectralClustering
from sklearn.metrics import silhouette_score

from tehillim_pipeline.similarity import SimilarityResult


@dataclass(frozen=True, slots=True)
class KSelectionResult:
    k_values: tuple[int, ...]
    silhouette_scores: tuple[float, ...]
    """Silhouette score of the spectral-clustering partition at each k in
    `k_values`, in the same order. -1.0 (the theoretical minimum) where a
    partition degenerates to fewer than 2 distinct clusters, since
    silhouette is undefined there."""
    eigengaps: tuple[float, ...]
    """Gap between the k-th and (k+1)-th smallest normalized-Laplacian
    eigenvalues, for each k in `k_values` - a large gap suggests k is a
    natural number of clusters for this affinity matrix."""
    best_k_by_silhouette: int
    best_k_by_eigengap: int
    partition_p_value: float
    """Permutation-test p-value for `best_k_by_silhouette`'s own partition
    (see `_partition_significance`): the fraction of random same-size-
    distribution relabelings of this same distance matrix whose silhouette
    score meets or exceeds the actual partition's. Silhouette itself can
    never return k=1 (it's undefined for a single cluster), so it can
    never directly say "there is no real structure here" - this is the
    mechanism that lets a winning k still be flagged as indistinguishable
    from noise."""


def analyze_k_selection(
    similarity: SimilarityResult,
    k_values: Sequence[int] = range(2, 11),
    *,
    partition_permutations: int = 2000,
    seed: int = 0,
) -> KSelectionResult:
    """Silhouette and eigengap scores for every k in `k_values`, over
    `similarity`'s own affinity matrix, plus a partition-significance
    p-value for whichever k silhouette prefers."""
    k_values = tuple(k_values)
    # Clip to non-negative: real cosine-similarity matrices can round to
    # very slightly above 1.0 (e.g. 1.0000000002 for a near-identical
    # pair), which would otherwise make 1 - similarity a tiny negative
    # float - harmless for embedding.py's linear algebra, but
    # silhouette_score's precomputed-distance check rejects any negative
    # value outright, however small.
    distance = np.clip(1.0 - similarity.matrix, 0.0, None)
    np.fill_diagonal(distance, 0.0)

    scored = [_silhouette_at_k(similarity.matrix, distance, k) for k in k_values]
    silhouette_scores = tuple(score for score, _ in scored)
    eigenvalues = _normalized_laplacian_eigenvalues(similarity.matrix)
    eigengaps = tuple(float(eigenvalues[k] - eigenvalues[k - 1]) for k in k_values)

    best_k_by_silhouette = k_values[int(np.argmax(silhouette_scores))]
    best_k_by_eigengap = k_values[int(np.argmax(eigengaps))]
    _, winning_labels = scored[k_values.index(best_k_by_silhouette)]
    partition_p_value = _partition_significance(
        distance, winning_labels, n_permutations=partition_permutations, seed=seed
    )

    return KSelectionResult(
        k_values=k_values,
        silhouette_scores=silhouette_scores,
        eigengaps=eigengaps,
        best_k_by_silhouette=best_k_by_silhouette,
        best_k_by_eigengap=best_k_by_eigengap,
        partition_p_value=partition_p_value,
    )


def cluster_labels(affinity: np.ndarray, k: int) -> np.ndarray:
    """Spectral-clustering labels for `k` clusters over `affinity` - the
    same partition every k-selection diagnostic in this module scores.
    `k=1` is handled directly (every point in one cluster) since
    `SpectralClustering` itself has no notion of a single-cluster
    partition."""
    if k <= 1:
        return np.zeros(affinity.shape[0], dtype=int)
    model = SpectralClustering(n_clusters=k, affinity="precomputed", random_state=0)
    return model.fit_predict(affinity)


def _silhouette_at_k(
    affinity: np.ndarray, distance: np.ndarray, k: int
) -> tuple[float, np.ndarray]:
    labels = cluster_labels(affinity, k)
    if len(set(labels)) < 2:
        # Silhouette is undefined for a single effective cluster (can
        # happen for a small k against a near-degenerate affinity graph) -
        # -1.0 is silhouette's own theoretical floor, so this k sorts as
        # the worst possible choice rather than crashing the whole sweep.
        return -1.0, labels
    return float(silhouette_score(distance, labels, metric="precomputed")), labels


def _partition_significance(
    distance: np.ndarray,
    labels: np.ndarray,
    *,
    n_permutations: int = 2000,
    seed: int = 0,
) -> float:
    """Tests whether `labels`'s own silhouette score is better than a
    random same-size-distribution relabeling of the same distance matrix
    would achieve by chance - addressing silhouette's bias toward
    degenerate partitions (a lopsided split can still score well simply by
    isolating a few outliers) by comparing it against the null it would
    face if the grouping carried no real information at all."""
    if len(set(labels)) < 2:
        # No real partition to test (analyze_k_selection only reaches this
        # via best_k_by_silhouette, which never prefers a degenerate k
        # unless every candidate is degenerate) - report "not significant"
        # rather than crash on silhouette_score's own precondition.
        return 1.0

    observed = float(silhouette_score(distance, labels, metric="precomputed"))
    rng = np.random.default_rng(seed)
    null_scores = np.empty(n_permutations)
    for i in range(n_permutations):
        shuffled = rng.permutation(labels)
        null_scores[i] = silhouette_score(distance, shuffled, metric="precomputed")

    exceedances = int(np.sum(null_scores >= observed))
    return (exceedances + 1) / (n_permutations + 1)


@dataclass(frozen=True, slots=True)
class KStabilityResult:
    """How consistently the silhouette k-sweep picks the same k when the
    corpus is resampled - a stability/confidence measure for knife-edge
    cases (e.g. two candidate k's silhouette scores within a few
    hundredths of each other) that `KSelectionResult` alone reports with
    false precision, since it only ever sees one draw of the corpus."""

    k_values: tuple[int, ...]
    win_counts: tuple[int, ...]
    """Number of subsamples (out of `n_subsamples`) whose own silhouette
    sweep preferred each k in `k_values`, in the same order."""
    most_stable_k: int
    """Whichever k won the most subsamples."""
    stability: float
    """`most_stable_k`'s win fraction: win_counts[i] / n_subsamples."""
    n_subsamples: int


def subsample_k_stability(
    similarity: SimilarityResult,
    k_values: Sequence[int] = range(2, 11),
    *,
    n_subsamples: int = 100,
    subsample_fraction: float = 0.8,
    seed: int = 0,
) -> KStabilityResult:
    """Draws `n_subsamples` random subsamples of the corpus (each a
    fraction `subsample_fraction` of the psalms, without replacement),
    reruns the silhouette k-sweep on each subsample's own similarity
    submatrix, and tallies which k wins each time.

    Subsampling without replacement (Politis & Romano's m-out-of-n
    bootstrap), not the classical with-replacement bootstrap - a
    similarity matrix is relational (each entry depends on a *pair* of
    psalms), so resampling its indices *with* replacement lets the same
    psalm be drawn twice, creating an off-diagonal pair that is trivially
    self-similar (the resampled matrix reuses that psalm's real
    self-similarity, 1.0, for its own pair) with no analogue in the real
    data - inflating apparent within-group cohesion in an unknown,
    uncorrectable direction for any resample containing a duplicate.
    Subsampling without replacement has no such artifact: every draw's
    submatrix is a genuine subset of the corpus's real pairwise
    structure, at the standard, well-understood statistical cost of a
    smaller effective sample size (`m = subsample_fraction * n` psalms
    per draw instead of all `n`), not an unquantified bias.
    """
    k_values = tuple(k_values)
    n = len(similarity.psalm_numbers)
    subsample_size = max(2, int(n * subsample_fraction))
    rng = np.random.default_rng(seed)

    win_counts = {k: 0 for k in k_values}
    for _ in range(n_subsamples):
        sample = rng.choice(n, size=subsample_size, replace=False)
        subsampled_matrix = similarity.matrix[np.ix_(sample, sample)]
        winner = _best_k_by_silhouette(subsampled_matrix, k_values)
        win_counts[winner] += 1

    most_stable_k = max(k_values, key=lambda k: win_counts[k])
    return KStabilityResult(
        k_values=k_values,
        win_counts=tuple(win_counts[k] for k in k_values),
        most_stable_k=most_stable_k,
        stability=win_counts[most_stable_k] / n_subsamples,
        n_subsamples=n_subsamples,
    )


def _best_k_by_silhouette(similarity_matrix: np.ndarray, k_values: Sequence[int]) -> int:
    distance = np.clip(1.0 - similarity_matrix, 0.0, None)
    np.fill_diagonal(distance, 0.0)
    scores = [_silhouette_at_k(similarity_matrix, distance, k)[0] for k in k_values]
    return k_values[int(np.argmax(scores))]


def _normalized_laplacian_eigenvalues(affinity: np.ndarray) -> np.ndarray:
    """Eigenvalues of the symmetric normalized graph Laplacian
    `L = I - D^-1/2 A D^-1/2`, ascending - the same construction spectral
    clustering itself uses internally."""
    degree = affinity.sum(axis=1)
    inv_sqrt_degree = np.diag(1.0 / np.sqrt(degree))
    normalized_affinity = inv_sqrt_degree @ affinity @ inv_sqrt_degree
    laplacian = np.eye(affinity.shape[0]) - normalized_affinity
    return np.linalg.eigvalsh(laplacian)


@dataclass(frozen=True, slots=True)
class GapStatisticResult:
    """The gap statistic (Tibshirani, Walther & Hastie, 2001): the k-
    selection diagnostic used in this module that can actually answer "is
    there any real cluster structure at all" - silhouette is undefined at
    k=1, so no matter how uninformative a signal's affinity matrix is, a
    silhouette sweep over k=2.. always reports some k as the winner.
    Comparing the real data's within-cluster dispersion against the same
    quantity for reference matrices with no structure (a random
    permutation of the real matrix's own off-diagonal values, preserving
    its exact value distribution while destroying which specific psalms
    are similar to which) gives k=1 an actual chance to win: it does,
    whenever the real dispersion curve looks no different from the
    structureless reference's own curve."""

    k_values: tuple[int, ...]
    gap: tuple[float, ...]
    """Gap(k) = mean(log within-cluster dispersion of the reference
    matrices at k) - log(within-cluster dispersion of the real data at
    k). Larger is better-supported; a `k` genuinely capturing real
    structure should disperse the real data far less than a structureless
    reference disperses at the same k."""
    standard_error: tuple[float, ...]
    """Reference-distribution standard error at each k, scaled by
    sqrt(1 + 1/n_references) per Tibshirani et al."""
    best_k: int
    """Smallest k satisfying the standard one-standard-error selection
    rule: Gap(k) >= Gap(k+1) - standard_error(k+1). Unlike every other
    k-selection diagnostic in this module, this can legitimately equal 1 -
    meaning the data showed no more cluster structure than a same-value-
    distribution reference with none by construction."""


def gap_statistic(
    similarity: SimilarityResult,
    k_values: Sequence[int] = range(1, 11),
    *,
    n_references: int = 10,
    seed: int = 0,
) -> GapStatisticResult:
    """Gap statistic over `similarity`'s own distance matrix (`1 -
    similarity.matrix`), letting k=1 ("no real structure") compete on
    equal footing with every other candidate k."""
    k_values = tuple(k_values)
    distance = np.clip(1.0 - similarity.matrix, 0.0, None)
    np.fill_diagonal(distance, 0.0)

    log_wk = np.array(
        [
            _log_within_cluster_dispersion(distance, cluster_labels(similarity.matrix, k))
            for k in k_values
        ]
    )

    rng = np.random.default_rng(seed)
    reference_log_wk = np.empty((n_references, len(k_values)))
    for b in range(n_references):
        reference_distance = _permute_distance_matrix(distance, rng)
        reference_affinity = np.clip(1.0 - reference_distance, 0.0, None)
        np.fill_diagonal(reference_affinity, 1.0)
        for i, k in enumerate(k_values):
            labels = cluster_labels(reference_affinity, k)
            reference_log_wk[b, i] = _log_within_cluster_dispersion(reference_distance, labels)

    mean_reference_log_wk = reference_log_wk.mean(axis=0)
    standard_deviation = reference_log_wk.std(axis=0)
    standard_error = standard_deviation * np.sqrt(1 + 1 / n_references)
    gap = mean_reference_log_wk - log_wk

    best_k = k_values[-1]
    for i in range(len(k_values) - 1):
        if gap[i] >= gap[i + 1] - standard_error[i + 1]:
            best_k = k_values[i]
            break

    return GapStatisticResult(
        k_values=k_values,
        gap=tuple(float(v) for v in gap),
        standard_error=tuple(float(v) for v in standard_error),
        best_k=best_k,
    )


def _log_within_cluster_dispersion(distance: np.ndarray, labels: np.ndarray) -> float:
    """log(Wk), the distance-based generalization (Tibshirani et al., eq.
    2) of within-cluster dispersion that needs only a distance matrix, not
    raw feature coordinates: for each cluster, sum squared distances over
    every ordered pair of its members, divide by twice the cluster size,
    and sum across clusters. A cluster of size 1 contributes 0 (no pairs
    to disperse). Floored at a small epsilon before taking the log, since
    a perfectly self-similar cluster (or a k=1 corpus with zero real
    dissimilarity) can drive Wk to exactly 0."""
    total = 0.0
    for label in set(labels.tolist()):
        members = np.where(labels == label)[0]
        n_r = len(members)
        if n_r < 2:
            continue
        submatrix = distance[np.ix_(members, members)]
        total += float(np.sum(submatrix**2)) / (2 * n_r)
    return float(np.log(max(total, 1e-12)))


def _permute_distance_matrix(distance: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """A symmetric random permutation of `distance`'s own off-diagonal
    values - preserves the exact distribution of pairwise distances while
    destroying which specific pair of psalms produced which value, the
    structureless reference the gap statistic compares real dispersion
    against."""
    n = distance.shape[0]
    upper = np.triu_indices(n, k=1)
    permuted_values = rng.permutation(distance[upper])
    result = np.zeros_like(distance)
    result[upper] = permuted_values
    return result + result.T
