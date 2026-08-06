"""Integration test against the real BHSA corpus - confirms
compute_genre_alignment wires cleanly end-to-end from a real
ClusteringResult, not just synthetic data.
"""

from __future__ import annotations

import pytest

from tehillim_pipeline.genre_alignment import compute_genre_alignment

pytestmark = pytest.mark.integration

#: Independently counted from gunkel_genre_index.GUNKEL_GENRE_INDEX
#: (see the module's own data-integrity tests) - genre_totals must match
#: this regardless of which clustering is fed in, since totals depend only
#: on the Gunkel index, not on the clustering's labels.
EXPECTED_GENRE_TOTALS = {
    "Hymn": 25,
    "Enthronement Psalm": 4,
    "Song of Zion": 6,
    "Individual Lament": 45,
    "Communal Complaint": 7,
    "Individual Thanksgiving": 8,
    "Community Thanksgiving": 2,
    "Royal Psalm": 9,
    "Wisdom Psalm": 9,
    "Liturgy": 12,
    "Legend / Ancient Story": 1,
    "Confession (National)": 2,
    "Mixed Type": 9,
    "Miscellaneous": 5,
}


def test_genre_totals_match_the_gunkel_index_regardless_of_clustering(
    verb_morphology_clustering,
):
    alignment = compute_genre_alignment(verb_morphology_clustering)
    totals = dict(zip(alignment.genres, alignment.genre_totals, strict=True))
    assert totals == EXPECTED_GENRE_TOTALS
    assert sum(alignment.genre_totals) == 144


def test_counts_are_consistent_across_different_clusterings_of_the_same_psalms(
    verb_morphology_clustering, person_profile_clustering
):
    # Genre totals are a property of the Gunkel index alone, so they must
    # be identical no matter which signal was clustered.
    a = compute_genre_alignment(verb_morphology_clustering)
    b = compute_genre_alignment(person_profile_clustering)
    assert a.genre_totals == b.genre_totals


def test_validation_scores_are_real_but_modest_not_near_perfect(
    verb_morphology_clustering, person_profile_clustering
):
    # Checked against real computed output first, not asserted from hope
    # (same discipline as every other integration test here): both signals
    # score above zero/random on every metric - real, non-coincidental
    # structure - but nowhere near 1.0. AMI (chance-corrected, unlike plain
    # NMI - see genre_alignment.py's module docstring) tells a sharper
    # story than a single shared bound could: verb-morphology's AMI is
    # barely above zero (~0.07) once chance agreement is properly
    # subtracted out, while person-profile's is meaningfully higher
    # (~0.16) - a real difference between the two signals that plain NMI's
    # upward bias had been flattening. An honest result either way:
    # 6-cluster spectral clustering recovers a modest amount of Gunkel's
    # genre scheme, not most of it, and person-profile does so somewhat
    # better than verb-morphology.
    verb_alignment = compute_genre_alignment(verb_morphology_clustering)
    person_alignment = compute_genre_alignment(person_profile_clustering)

    assert 0.0 < verb_alignment.ami < 0.15
    assert 0.1 < person_alignment.ami < 0.3
    assert person_alignment.ami > verb_alignment.ami

    for alignment in (verb_alignment, person_alignment):
        assert 0.0 < alignment.ari < 0.5
        assert 0.3 < alignment.purity < 0.6


def test_verb_morphology_clustering_leaves_most_genres_without_a_cluster(
    verb_morphology_clustering,
):
    # verb-morphology's data-chosen cluster count (see
    # cluster_methods.py's data_driven_k) is far smaller than Gunkel's
    # 14-genre decomposition - 2 clusters can win at most 2 of the 14
    # genre labels via the Hungarian assignment (see genre_alignment.py's
    # module docstring), so most genres necessarily go unmatched
    # regardless of how good the underlying signal is. True for any k
    # smaller than the genre count, not just the specific k found here.
    alignment = compute_genre_alignment(verb_morphology_clustering)
    assigned_genres = {label for label in alignment.cluster_genre_labels if label is not None}
    assert len(assigned_genres) <= verb_morphology_clustering.n_clusters
    assert len(assigned_genres) < len(alignment.genres)
