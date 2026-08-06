"""Integration tests against the real BHSA corpus.

Checked against real computed output first (see the analysis run during
development), not asserted from hope - the same discipline every other
integration test in this project follows. Two honest findings shaped what's
asserted here rather than what the roadmap's working hypothesis expected:

1. Final Hallel (146-150) does NOT land in one clean cluster under
   verb-morphology clustering - it splits into two coherent subgroups
   (146/147/149 and 148/150). This echoes the already-documented finding
   that the broad "hymn" category doesn't cohere as a whole; clustering
   surfaces the same real structure the pairwise similarity data showed.
2. `clause_relation` and `verb_sense` are sparse features (22.5% and 12.6%
   word coverage) - a handful of psalms have essentially zero tagged words
   under one of them and end up as isolated nodes in that signal's
   similarity graph (checked directly: psalms 29/43/93/110/150 under
   clause_relation, psalm 150 under verb_sense). Spectral clustering still
   assigns them a cluster deterministically, but which cluster is not a
   meaningful result for those specific psalm/signal combinations - so
   nothing here asserts a specific cluster for them, only that clustering
   completes and produces valid output.

The lexical family (lexical, root, named-entity-identity, lexical-set,
named-entity) is clustered too, but only against the generic structural
sanity checks below - those partitions are thematic (which words/names two
psalms share), not genre, so there's no Gunkel-exemplar hypothesis to test
against them (see cluster_methods.py's docstring).
"""

from __future__ import annotations

import pytest

from tehillim_pipeline import ground_truth as gt

pytestmark = pytest.mark.integration


def _cluster_of(clustering, psalm: int) -> int:
    index = clustering.psalm_numbers.index(psalm)
    return clustering.labels[index]


# --- Structural sanity, every signal ---------------------------------------


_ALL_CLUSTERING_FIXTURES = [
    "lexical_clustering",
    "root_clustering",
    "named_entity_identity_clustering",
    "verb_morphology_clustering",
    "person_profile_clustering",
    "lexical_set_clustering",
    "named_entity_clustering",
    "clause_type_clustering",
    "text_type_clustering",
    "clause_relation_clustering",
    "verb_sense_clustering",
]


@pytest.mark.parametrize("fixture_name", _ALL_CLUSTERING_FIXTURES)
def test_every_clustering_covers_all_150_psalms(fixture_name, request):
    clustering = request.getfixturevalue(fixture_name)
    assert clustering.psalm_numbers == tuple(range(1, 151))
    assert len(clustering.labels) == 150


@pytest.mark.parametrize("fixture_name", _ALL_CLUSTERING_FIXTURES)
def test_every_clustering_uses_a_data_chosen_cluster_count(fixture_name, request):
    # Each signal picks its own k via data_driven_k(cluster_methods._K_VALUES)
    # (see cluster_methods.py) - no longer a shared fixed 6, since that
    # number was arbitrary (matched to Gunkel's genre count, not to
    # anything about the data) and the data doesn't actually support it
    # for either validated genre-fingerprint signal (see the top-level
    # README's "Statistical validation methodology" section). k=1 is a
    # legitimate answer, not a bug: the gap statistic gates every choice
    # first, and for text-type specifically it finds no more structure
    # than a same-value-distribution reference with none by construction -
    # silhouette alone could never report that (it's undefined at k=1), so
    # seeing it appear here for a real signal is the gate working as
    # intended, not a regression.
    clustering = request.getfixturevalue(fixture_name)
    assert 1 <= clustering.n_clusters <= 10
    assert all(0 <= label < clustering.n_clusters for label in clustering.labels)


# --- Twin psalms: the cleanest possible correctness check -------------------


def test_near_total_duplicate_twins_share_a_cluster_under_verb_morphology_and_clause_type(
    verb_morphology_clustering, clause_type_clustering
):
    # Checked empirically across all four TWIN_PSALMS pairs: only the two
    # near-total-duplicate pairs (14/53; 57 recurring almost wholesale as
    # 108:2-6) consistently share a cluster under both methods. The two
    # partial-overlap pairs (40:14-18 recurring as all of Psalm 70; 60:7-14
    # recurring as part of Psalm 108) do NOT reliably share a cluster -
    # a partial, few-verse textual overlap doesn't necessarily carry the
    # whole psalm's grammatical profile with it. That's an honest, expected
    # limit of whole-psalm clustering, not a bug - exactly the gap the
    # roadmap's sub-psalm segmentation phase is meant to close.
    near_total_duplicate_pairs = [pair for pair in gt.TWIN_PSALMS if pair.psalms == (14, 53)] + [
        pair for pair in gt.TWIN_PSALMS if pair.psalms == (57, 108)
    ]
    assert len(near_total_duplicate_pairs) == 2

    for pair in near_total_duplicate_pairs:
        for clustering in (verb_morphology_clustering, clause_type_clustering):
            labels = {_cluster_of(clustering, psalm) for psalm in pair.psalms}
            assert len(labels) == 1


# --- Individual vs. communal lament under person-profile clustering --------


def test_individual_laments_all_share_one_cluster(person_profile_clustering):
    individual = gt.GUNKEL_GENRE_EXEMPLARS["individual_lament"]
    labels = {_cluster_of(person_profile_clustering, psalm) for psalm in individual}
    assert len(labels) == 1


def test_communal_laments_do_not_share_the_individual_lament_cluster(person_profile_clustering):
    individual = gt.GUNKEL_GENRE_EXEMPLARS["individual_lament"]
    communal = gt.GUNKEL_GENRE_EXEMPLARS["communal_lament"]
    individual_cluster = _cluster_of(person_profile_clustering, individual[0])
    communal_clusters = {_cluster_of(person_profile_clustering, psalm) for psalm in communal}
    assert individual_cluster not in communal_clusters


# --- Final Hallel under verb-morphology clustering: the honest result -----


def test_final_hallel_splits_into_two_coherent_subgroups(verb_morphology_clustering):
    # Checked empirically: 146/147/149 land together, 148/150 land together
    # - two real subgroups, not one clean cluster. This matches the
    # already-documented finding that the broad hymn category doesn't
    # cohere as a whole.
    labels = {psalm: _cluster_of(verb_morphology_clustering, psalm) for psalm in gt.HALLEL_FINAL}
    assert labels[146] == labels[147] == labels[149]
    assert labels[148] == labels[150]
    assert labels[146] != labels[148]


def test_final_hallel_purest_imperative_pair_shares_a_cluster(verb_morphology_clustering):
    # Psalm 148 and 150 are the two shortest, most purely imperative-praise
    # psalms in the Final Hallel - the tightest possible pairing within it.
    assert _cluster_of(verb_morphology_clustering, 148) == _cluster_of(
        verb_morphology_clustering, 150
    )
