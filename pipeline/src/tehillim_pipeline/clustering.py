"""Clustering methods over psalm similarity results.

Each clustering method takes a `SimilarityResult` (an already-computed N x N
psalm similarity matrix) and produces a partition of the corpus - one
cluster label per psalm. The `ClusteringMethod` Protocol defines the shape a
method must have, mirroring `similarity.py`'s `SimilarityMethod`.

`SpectralClusteringMethod` implements the one algorithm used so far:
treat the similarity matrix as a precomputed affinity graph and partition
it via spectral clustering. This is deliberately the simplest of the three
clustering algorithms named in the project roadmap (spectral,
Gaussian-mixture, Random Forest proximity): it consumes a `SimilarityResult`
exactly as computed, with no additional feature extraction, embedding, or
numerical-stability work required - unlike Gaussian-mixture clustering
(needs a coordinate embedding, since GMM fits covariance in feature space
rather than working from pairwise similarity) or Random Forest proximity
(needs the raw per-psalm feature vectors, not the similarity matrix, and
computes its own, structurally different affinity). Both will implement
this same Protocol once their own prerequisites are built - new capability
is added by writing a new concrete class against the existing Protocol,
not by changing it.

How many clusters to produce is itself pluggable, via a `KSelector` - a
function from a `SimilarityResult` to a `KChoice` - rather than a bare
`int` baked into each method at configuration time. `fixed_k(n)`
reproduces the old always-n behavior (with no data-driven diagnostics, so
its `KChoice` carries `None` for both); `data_driven_k(k_values)` picks k
from the data itself (see k_selection.py), computed fresh each time
`compute()` runs so different signals can genuinely prefer different k.
This replaced a single shared `n_clusters=6` that had been chosen by
matching Gunkel's traditional genre count, not by anything about the
data - once `k_selection.py`'s diagnostics showed the data didn't
actually support 6 for either validated genre-fingerprint signal, keeping
a number that was arbitrary to begin with stopped being defensible.

`data_driven_k` is gated by the gap statistic before it ever looks at
silhouette score: silhouette is mathematically undefined for a single
cluster, so a silhouette-only sweep over k=2.. can never conclude "this
signal shows no real structure" - it always reports some k as the
winner, however uninformative the affinity matrix actually is. The gap
statistic can and does return k=1 for exactly that case (see
`k_selection.gap_statistic`'s own docstring), so this selector checks it
first; only once real structure is confirmed does it fall back to
silhouette (plus a partition-significance p-value and subsample
stability) to choose k among 2 and up.
"""

from __future__ import annotations

import warnings
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Protocol

from tehillim_pipeline.k_selection import (
    analyze_k_selection,
    cluster_labels,
    gap_statistic,
    subsample_k_stability,
)
from tehillim_pipeline.similarity import SimilarityResult


@dataclass(frozen=True, slots=True)
class KChoice:
    """A chosen cluster count, plus (where the choice is data-driven) the
    diagnostics that back it."""

    n_clusters: int
    partition_p_value: float | None
    """`None` for a `fixed_k` choice, since significance doesn't apply to
    a count that wasn't derived from the data at all. Otherwise this
    choice's own partition-significance p-value - see
    `k_selection._partition_significance`."""
    stability: float | None
    """`None` for a `fixed_k` choice, for the same reason. Otherwise the
    fraction of subsamples whose own silhouette sweep agreed with this
    exact k - see `k_selection.subsample_k_stability`."""


KSelector = Callable[[SimilarityResult], KChoice]
"""A strategy for choosing how many clusters to produce from a given
similarity matrix - see `fixed_k` and `data_driven_k`."""


def fixed_k(n: int) -> KSelector:
    """Always cluster into exactly `n` groups, regardless of the data."""
    return lambda _similarity: KChoice(n_clusters=n, partition_p_value=None, stability=None)


def data_driven_k(
    k_values: Sequence[int],
    *,
    n_subsamples: int = 100,
    n_gap_references: int = 10,
    seed: int = 0,
) -> KSelector:
    """Chooses k from the data, checking first whether there is any real
    cluster structure at all.

    The gap statistic (`k_selection.gap_statistic`) is evaluated over
    `k_values` plus k=1; if it prefers k=1, that's the final answer - a
    signal with no real structure gets one trivial cluster, not a
    silhouette-selected k presented as if it meant something. Otherwise,
    k is chosen by the highest silhouette score among `k_values` (see
    `k_selection.analyze_k_selection`), with a partition-significance
    p-value and subsample stability figure attached so a knife-edge or
    statistically weak choice isn't presented with false confidence.
    """
    k_values = tuple(k_values)

    def select(similarity: SimilarityResult) -> KChoice:
        gap = gap_statistic(
            similarity, k_values=(1, *k_values), n_references=n_gap_references, seed=seed
        )
        if gap.best_k == 1:
            return KChoice(n_clusters=1, partition_p_value=None, stability=None)

        selection = analyze_k_selection(similarity, k_values=k_values)
        chosen_k = selection.best_k_by_silhouette
        stability_result = subsample_k_stability(
            similarity, k_values=k_values, n_subsamples=n_subsamples, seed=seed
        )
        stability = stability_result.win_counts[k_values.index(chosen_k)] / n_subsamples
        return KChoice(
            n_clusters=chosen_k,
            partition_p_value=selection.partition_p_value,
            stability=stability,
        )

    return select


@dataclass(frozen=True, slots=True)
class ClusteringResult:
    method: str
    description: str
    psalm_numbers: tuple[int, ...]
    labels: tuple[int, ...]
    """Cluster index per psalm, zero-indexed, same order as `psalm_numbers`."""
    n_clusters: int
    partition_p_value: float | None = None
    """This clustering's own k-choice diagnostics, carried through from
    the `KSelector` that produced it - see `KChoice`. `None` for a
    `fixed_k`-configured method, or for a `ClusteringResult` built
    directly (e.g. in tests) without going through `SpectralClusteringMethod`."""
    k_stability: float | None = None
    """See `KChoice.stability`."""


class ClusteringMethod(Protocol):
    """A named, documented way to turn a SimilarityResult into a psalm
    partition."""

    name: str
    description: str

    def compute(self, similarity: SimilarityResult) -> ClusteringResult: ...


class SpectralClusteringMethod:
    """Partition psalms via spectral clustering over an already-computed
    similarity matrix, treated as a precomputed affinity graph.

    `random_state` is fixed (not exposed as a parameter) so results are
    reproducible run to run - required for both the test suite and for the
    "validate every phase against known scholarship" discipline the rest
    of this project follows, which only works if a given method's output
    is stable to check against.
    """

    def __init__(self, name: str, description: str, k_selector: KSelector) -> None:
        self.name = name
        self.description = description
        self.k_selector = k_selector

    def compute(self, similarity: SimilarityResult) -> ClusteringResult:
        choice = self.k_selector(similarity)
        n_clusters = choice.n_clusters
        # Sparse signals (e.g. clause-relation, verb-sense) can leave a
        # handful of psalms with ~zero similarity to every other psalm,
        # making them isolated nodes in the affinity graph - sklearn warns
        # about this every time. Diagnosed and documented (see
        # test_clustering_integration.py's module docstring): clustering
        # still completes deterministically, so this is a known, accepted
        # limitation for those specific psalm/signal pairs, not a bug to
        # silently paper over - it's suppressed here because it's already
        # handled, not because it's ignored.
        #
        # `cluster_labels` (shared with k_selection.py's own diagnostics)
        # handles n_clusters=1 directly rather than asking
        # SpectralClustering for a single-cluster partition it has no real
        # notion of - a data_driven_k selector can legitimately choose 1
        # (see gap_statistic), and every k-value this method ever computes
        # a partition for should go through the exact same code path.
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore", message="Graph is not fully connected", category=UserWarning
            )
            labels = cluster_labels(similarity.matrix, n_clusters)
        return ClusteringResult(
            method=self.name,
            description=self.description,
            psalm_numbers=similarity.psalm_numbers,
            labels=tuple(int(label) for label in labels),
            n_clusters=n_clusters,
            partition_p_value=choice.partition_p_value,
            k_stability=choice.stability,
        )
