"""Integration tests for the four embedding-based Cluster-page-only
signals (semantic_embedding.py), against the real, full-corpus computed
output - not asserted from hope, the same discipline every other
integration test in this project follows.

The headline finding this guards against regressing: unfinetuned
AlephBERT finds real cluster structure (k > 1) under both aggregations,
while MiqraBERT collapses to k=1 (no structure) under both - see the
top-level README's "Statistical validation methodology" for the full
numbers and the most plausible explanation (fine-tuning for
parallel-passage detection likely destroyed the general-semantic variation
genre discrimination depends on).
"""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.integration

_ALL_SEMANTIC_CLUSTERING_FIXTURES = [
    "miqrabert_mean_pool_clustering",
    "miqrabert_soft_alignment_clustering",
    "alephbert_mean_pool_clustering",
    "alephbert_soft_alignment_clustering",
]


@pytest.mark.parametrize("fixture_name", _ALL_SEMANTIC_CLUSTERING_FIXTURES)
def test_clustering_covers_all_150_psalms_with_valid_labels(fixture_name, request):
    clustering = request.getfixturevalue(fixture_name)
    assert len(clustering.psalm_numbers) == 150
    assert len(clustering.labels) == 150
    assert all(0 <= label < clustering.n_clusters for label in clustering.labels)


def test_miqrabert_variants_find_no_real_structure(
    miqrabert_mean_pool_clustering, miqrabert_soft_alignment_clustering
):
    assert miqrabert_mean_pool_clustering.n_clusters == 1
    assert miqrabert_soft_alignment_clustering.n_clusters == 1


def test_alephbert_variants_find_real_structure(
    alephbert_mean_pool_clustering, alephbert_soft_alignment_clustering
):
    assert alephbert_mean_pool_clustering.n_clusters > 1
    assert alephbert_soft_alignment_clustering.n_clusters > 1
