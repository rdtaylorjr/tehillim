"""Cross-tabulates a computed clustering against Gunkel's psalm-by-psalm
genre classification (`gunkel_genre_index.py`) - the ground truth behind
the Cluster page's genre-alignment matrix. A clean concentration (one
genre's psalms landing mostly in one cluster) is visual evidence the
signal recovers that genre; a genre spread evenly across every cluster is
evidence it doesn't.

Two granularities are computed, both from the same underlying index:
`compute_genre_alignment` against the 14-genre decomposition
(`GUNKEL_GENRES`), and `compute_family_alignment` against Gunkel's own
six top-level chapter families (`GUNKEL_FAMILIES`) - checked empirically
against real clustering output before shipping, per this project's usual
discipline: coarsening did *not* uniformly improve agreement (NMI/ARI
dropped for the two signals checked), so the family view is offered as a
genuinely different lens, not presented as "the fixed-up version" of the
genre view.

Cluster indices from `SpectralClusteringMethod` are arbitrary integers
with no inherent meaning (an artifact of the internal k-means step over a
spectral embedding) and carry no relationship across different clustering
runs. Two things this module does about that, both standard external
cluster-validation technique (see e.g. Georgia Tech ISYE 6740's clustering
evaluation material, not the HDDA/6525-8803 course - that one's named
methods, functional PCA/robust PCA/tensor decomposition, target later
trajectory/fusion phases, not this problem):

1. `_match_clusters_to_categories` solves the linear sum assignment problem
   (the Hungarian algorithm) on the contingency table to find the
   one-to-one cluster-to-category labeling that maximizes total overlap, so
   a cluster can be honestly captioned "this is the psalms-that-look-like-
   Hymn cluster" instead of displayed under a meaningless index number. A
   cluster whose best remaining option shares zero psalms with it is left
   unlabeled rather than forced into a nonsense assignment - with 6
   clusters and 14 genres, most genres won't win a cluster at all, which
   is an honest result, not a bug.
2. Purity, Adjusted Mutual Information, and the Adjusted Rand Index are
   computed as label-assignment-independent summary scores - unlike (1),
   none of these require solving (or care about) any particular
   cluster-to-category correspondence, so they're the defensible numbers to
   cite for "how well does this signal recover Gunkel's genres," rather
   than an eyeballed read of the table. AMI, not the more commonly-seen
   plain NMI, deliberately: NMI has no correction for chance agreement and
   is known to be biased upward exactly when the category count is large
   relative to sample size and unevenly sized (14 Gunkel genres, some with
   a single member, over ~144 psalms - precisely that regime), which would
   make it inconsistent with ARI sitting right next to it, since ARI's
   entire reason for being reported is its own chance correction.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np
from scipy.optimize import linear_sum_assignment
from sklearn.metrics import adjusted_mutual_info_score, adjusted_rand_score

from tehillim_pipeline.clustering import ClusteringResult
from tehillim_pipeline.gunkel_genre_index import (
    GENRE_FAMILY,
    GUNKEL_FAMILIES,
    GUNKEL_GENRE_INDEX,
    GUNKEL_GENRES,
    GunkelClassification,
)


@dataclass(frozen=True, slots=True)
class GenreAlignment:
    """Contingency table cross-tabulating `clustering` against a Gunkel
    categorization (genres or families), plus a cluster-to-category
    labeling and external validation scores derived from it."""

    genres: tuple[str, ...]
    """Rows, in canonical order (`GUNKEL_GENRES` or `GUNKEL_FAMILIES`)."""
    counts: tuple[tuple[int, ...], ...]
    """counts[category_index][cluster_index]"""
    genre_totals: tuple[int, ...]
    """counts[category_index] summed - how many indexed psalms carry that category."""
    cluster_genre_labels: tuple[str | None, ...]
    """Best-matching category per cluster index (optimal one-to-one
    assignment maximizing total overlap - see module docstring), or None
    where no category with nonzero overlap remained available for that
    cluster."""
    purity: float
    """Sum, over clusters, of that cluster's largest single-category count,
    divided by the number of indexed psalms - unlike
    `cluster_genre_labels`, clusters may share a majority category here."""
    ami: float
    """Adjusted Mutual Information between cluster assignment and the
    Gunkel category, over indexed psalms - corrected for chance agreement
    (unlike plain NMI), so ~0 for a random/independent clustering and 1 for
    a clustering that reproduces it exactly; can go slightly negative, like
    ARI, for agreement worse than chance."""
    ari: float
    """Adjusted Rand Index, same scope - agreement on which psalm *pairs*
    are grouped together, corrected for chance."""
    ami_p_value: float
    """Permutation-test p-value for `ami`: the fraction of random
    relabelings of the cluster assignment (same cluster-size distribution,
    Gunkel categories held fixed) whose AMI against the real categories
    meets or exceeds the observed one. AMI is already chance-corrected in
    expectation, but a single realized value can still look high by luck
    on a small, unevenly-sized category set (this project's exact regime -
    14 genres over ~144 psalms) - this is the test that actually checks
    it, on a per-signal basis. Not yet corrected for running this test
    across every shipped signal - see the top-level README's "Statistical
    validation methodology" section for the cross-signal
    Benjamini-Hochberg correction applied to these p-values together."""


def compute_genre_alignment(
    clustering: ClusteringResult, *, ami_permutations: int = 2000
) -> GenreAlignment:
    """Cross-tabulates `clustering` against Gunkel's 14-genre decomposition."""
    return _cross_tabulate(
        clustering,
        categories=GUNKEL_GENRES,
        category_of_entry=lambda entry: entry.genre,
        ami_permutations=ami_permutations,
    )


def compute_family_alignment(
    clustering: ClusteringResult, *, ami_permutations: int = 2000
) -> GenreAlignment:
    """Cross-tabulates `clustering` against Gunkel's six top-level chapter
    families - the same index, coarsened via `GENRE_FAMILY`."""
    return _cross_tabulate(
        clustering,
        categories=GUNKEL_FAMILIES,
        category_of_entry=lambda entry: GENRE_FAMILY[entry.genre],
        ami_permutations=ami_permutations,
    )


def _cross_tabulate(
    clustering: ClusteringResult,
    *,
    categories: tuple[str, ...],
    category_of_entry: Callable[[GunkelClassification], str],
    ami_permutations: int = 2000,
) -> GenreAlignment:
    """Psalms with no primary Gunkel classification (the excluded
    composite/partial psalms - see `gunkel_genre_index.GUNKEL_EXCLUDED_PSALMS`)
    are skipped entirely: not counted toward any category, cluster, or
    validation score, rather than forced into a misleading bucket.
    """
    label_by_psalm = dict(zip(clustering.psalm_numbers, clustering.labels, strict=True))
    category_index = {category: i for i, category in enumerate(categories)}

    counts = [[0] * clustering.n_clusters for _ in categories]
    true_categories: list[str] = []
    predicted_clusters: list[int] = []
    for entry in GUNKEL_GENRE_INDEX:
        label = label_by_psalm.get(entry.psalm)
        if label is None:
            continue
        category = category_of_entry(entry)
        counts[category_index[category]][label] += 1
        true_categories.append(category)
        predicted_clusters.append(label)

    category_totals = tuple(sum(row) for row in counts)
    total_psalms = len(true_categories)

    n_categories = len(categories)
    cluster_majorities = (
        max(counts[cat_i][cluster_i] for cat_i in range(n_categories))
        for cluster_i in range(clustering.n_clusters)
    )
    purity = sum(cluster_majorities) / total_psalms if total_psalms else 0.0

    cluster_labels = _match_clusters_to_categories(counts, categories, clustering.n_clusters)
    ami = adjusted_mutual_info_score(true_categories, predicted_clusters)

    return GenreAlignment(
        genres=categories,
        counts=tuple(tuple(row) for row in counts),
        genre_totals=category_totals,
        cluster_genre_labels=cluster_labels,
        purity=purity,
        ami=ami,
        ari=adjusted_rand_score(true_categories, predicted_clusters),
        ami_p_value=_permutation_test_ami(
            true_categories, predicted_clusters, observed=ami, n_permutations=ami_permutations
        ),
    )


def _permutation_test_ami(
    true_categories: list[str],
    predicted_clusters: list[int],
    *,
    observed: float,
    n_permutations: int = 2000,
    seed: int = 0,
) -> float:
    """Tests whether `observed` AMI is better than a random same-size-
    distribution relabeling of the cluster assignment would achieve by
    chance - never assumes independence between psalms, only
    exchangeability under the null (if the clustering carried no real
    category information, any relabeling of which psalm got which cluster
    index is equally likely)."""
    if len(set(predicted_clusters)) < 2:
        # A single-cluster "partition" (a data_driven_k signal with no
        # real structure - see k_selection.gap_statistic) has no
        # meaningful AMI to test the significance of.
        return 1.0

    rng = np.random.default_rng(seed)
    predicted = np.array(predicted_clusters)
    null_scores = np.empty(n_permutations)
    for i in range(n_permutations):
        shuffled = rng.permutation(predicted)
        null_scores[i] = adjusted_mutual_info_score(true_categories, shuffled)

    exceedances = int(np.sum(null_scores >= observed))
    return (exceedances + 1) / (n_permutations + 1)


def _match_clusters_to_categories(
    counts: list[list[int]], categories: tuple[str, ...], n_clusters: int
) -> tuple[str | None, ...]:
    """Solves the assignment problem that maximizes total overlap between
    clusters and categories, one distinct category per cluster (linear sum
    assignment / the Hungarian algorithm) - the same technique used to
    compute "clustering accuracy" against known labels.

    Deliberately matches on raw counts, not each category's row-normalized
    share. Row-normalized shares were tried and rejected: a category with
    only 1-2 indexed psalms can trivially land 100% inside whichever
    cluster it happens to fall into, handing it a "perfect" match that is
    really just small-sample noise (checked directly - normalizing let
    one-psalm categories outrank real, larger concentrations). Raw counts
    avoid that, at the cost of a real, accepted trade-off in the other
    direction: a category with total overlap in one cluster (say, all 4 of
    its psalms) can still lose that cluster's label to a larger category
    with a merely-majority share (say, 5 of 9 psalms), because 5
    correctly-labeled psalms beats 4 in the sum this assignment actually
    maximizes. That larger category's win is still visible directly in the
    contingency table - it just doesn't become the column's caption - so
    no information is hidden, only the one-line label each cluster gets.
    """
    n_categories = len(categories)
    cost = np.array(
        [
            [-counts[cat_i][cluster_i] for cat_i in range(n_categories)]
            for cluster_i in range(n_clusters)
        ]
    )
    cluster_rows, category_cols = linear_sum_assignment(cost)

    labels: list[str | None] = [None] * n_clusters
    for cluster_index, category_col in zip(cluster_rows, category_cols, strict=True):
        if counts[category_col][cluster_index] > 0:
            labels[cluster_index] = categories[category_col]
    return tuple(labels)
