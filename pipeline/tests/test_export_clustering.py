from __future__ import annotations

import pytest

from tehillim_pipeline.clustering import ClusteringResult
from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.embedding import Embedding2D
from tehillim_pipeline.export_clustering import build_clustering_payload


def _psalms() -> list[Psalm]:
    return [
        Psalm(number=1, verse_count=2, incipit="אשרי", words=()),
        Psalm(number=2, verse_count=3, incipit="למה", words=()),
        Psalm(number=3, verse_count=1, incipit="יהוה", words=()),
        Psalm(number=4, verse_count=4, incipit="הבו", words=()),
    ]


def _verb_morphology_clustering() -> ClusteringResult:
    return ClusteringResult(
        method="verb-morphology-spectral",
        description="verb morphology cluster test",
        psalm_numbers=(1, 2, 3, 4),
        labels=(0, 0, 1, 1),
        n_clusters=2,
        partition_p_value=0.012,
        k_stability=0.85,
    )


def _person_clustering() -> ClusteringResult:
    # Deliberately omits partition_p_value/k_stability, mirroring a
    # fixed_k-configured method - both should pass through as None rather
    # than a made-up default.
    return ClusteringResult(
        method="person-profile-spectral",
        description="person cluster test",
        psalm_numbers=(1, 2, 3, 4),
        labels=(1, 0, 0, 1),
        n_clusters=2,
    )


def _embedding(method: str) -> Embedding2D:
    return Embedding2D(
        method=method,
        psalm_numbers=(1, 2, 3, 4),
        x=(0.1, 0.2, -0.1, -0.2),
        y=(0.3, -0.3, 0.1, -0.1),
        structure_captured=0.87,
    )


def _payload():
    return build_clustering_payload(
        psalms=_psalms(),
        results=[_verb_morphology_clustering(), _person_clustering()],
        embeddings=[
            _embedding("verb-morphology-spectral"),
            _embedding("person-profile-spectral"),
        ],
        default_method="verb-morphology-spectral",
        ami_permutations=50,
    )


def test_payload_has_expected_top_level_keys():
    payload = _payload()
    assert set(payload) == {
        "generatedAt",
        "corpus",
        "psalms",
        "clusterMethods",
        "defaultClusterMethod",
    }


def test_corpus_and_default_method_are_recorded():
    payload = _payload()
    assert payload["corpus"] == {"name": "ETCBC/BHSA", "version": "2021"}
    assert payload["defaultClusterMethod"] == "verb-morphology-spectral"


def test_psalms_are_method_independent_and_shared_across_methods():
    payload = _payload()
    assert len(payload["psalms"]) == 4
    assert payload["psalms"][0] == {"number": 1, "verseCount": 2, "wordCount": 0, "incipit": "אשרי"}


def test_both_methods_are_present_with_correct_ids():
    payload = _payload()
    ids = [m["id"] for m in payload["clusterMethods"]]
    assert ids == ["verb-morphology-spectral", "person-profile-spectral"]


def test_each_method_carries_its_own_description_and_cluster_count():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    assert verb["description"] == "verb morphology cluster test"
    assert verb["nClusters"] == 2


def test_carries_partition_significance_and_stability_diagnostics_when_present():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    assert verb["partitionPValue"] == pytest.approx(0.012)
    assert verb["kStability"] == pytest.approx(0.85)


def test_diagnostics_are_null_for_a_fixed_k_method_without_them():
    payload = _payload()
    person = next(m for m in payload["clusterMethods"] if m["id"] == "person-profile-spectral")
    assert person["partitionPValue"] is None
    assert person["kStability"] is None


def test_assignments_map_psalm_number_to_cluster_index():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    assert verb["assignments"] == {"1": 0, "2": 0, "3": 1, "4": 1}


def test_clusters_group_psalm_numbers_by_label():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    clusters = {c["index"]: c["psalmNumbers"] for c in verb["clusters"]}
    assert clusters == {0: [1, 2], 1: [3, 4]}


def test_cluster_sizes_match_their_psalm_number_lists():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    for cluster in verb["clusters"]:
        assert cluster["size"] == len(cluster["psalmNumbers"])


def test_clusters_are_ordered_by_index():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    indices = [c["index"] for c in verb["clusters"]]
    assert indices == sorted(indices)


def test_embedding_coordinates_are_present_and_match_psalm_order():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    assert verb["embedding"] == {
        "x": [0.1, 0.2, -0.1, -0.2],
        "y": [0.3, -0.3, 0.1, -0.1],
        "structureCaptured": 0.87,
    }


def test_genre_alignment_is_present_with_genres_matching_the_canonical_list():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    alignment = verb["genreAlignment"]
    assert set(alignment) == {
        "genres",
        "counts",
        "genreTotals",
        "clusterGenreLabels",
        "purity",
        "ami",
        "ari",
        "amiPValue",
        "amiPValueAdjusted",
    }
    assert len(alignment["counts"]) == len(alignment["genres"])
    assert all(len(row) == 2 for row in alignment["counts"])  # n_clusters == 2


def test_family_alignment_is_present_with_the_six_family_list():
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    alignment = verb["familyAlignment"]
    assert set(alignment) == {
        "genres",
        "counts",
        "genreTotals",
        "clusterGenreLabels",
        "purity",
        "ami",
        "ari",
        "amiPValue",
        "amiPValueAdjusted",
    }
    assert alignment["genres"] == [
        "Hymn",
        "Lament",
        "Royal Psalm",
        "Thanksgiving",
        "Wisdom Psalm",
        "Minor/Mixed Types",
    ]


def test_genre_alignment_includes_cluster_labels_and_validation_scores():
    # Psalms 1-4: cluster 0 = {Wisdom, Royal} (tied 1 each), cluster 1 =
    # {Individual Lament, Individual Lament} (unrivaled at 2) - computed
    # directly against genre_alignment.compute_genre_alignment to confirm
    # this is the same value the export just passes through.
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    alignment = verb["genreAlignment"]
    assert alignment["clusterGenreLabels"][1] == "Individual Lament"
    assert alignment["purity"] == pytest.approx(0.75)
    assert alignment["ami"] == pytest.approx(0.5714285714285714)
    assert alignment["ari"] == pytest.approx(0.5714285714285714)


def test_genre_alignment_counts_match_gunkel_genre_index():
    # Psalm 1 = Wisdom Psalm, Psalm 2 = Royal Psalm, Psalms 3-4 = Individual
    # Lament (gunkel_genre_index.py); verb-morphology clusters them {1,2}/{3,4}.
    payload = _payload()
    verb = next(m for m in payload["clusterMethods"] if m["id"] == "verb-morphology-spectral")
    alignment = verb["genreAlignment"]
    counts_by_genre = dict(zip(alignment["genres"], alignment["counts"], strict=True))
    assert counts_by_genre["Wisdom Psalm"] == [1, 0]
    assert counts_by_genre["Royal Psalm"] == [1, 0]
    assert counts_by_genre["Individual Lament"] == [0, 2]
    assert sum(alignment["genreTotals"]) == 4


def test_ami_p_value_is_bh_corrected_across_every_shipped_signal():
    # BH correction needs the full set of p-values across every signal, not
    # just one - checked directly against `benjamini_hochberg` on the same
    # two raw values this payload's own genreAlignment.amiPValue reports,
    # so this is provably the same correction, not just "some number".
    payload = _payload()
    raw_p_values = [m["genreAlignment"]["amiPValue"] for m in payload["clusterMethods"]]
    adjusted_p_values = [m["genreAlignment"]["amiPValueAdjusted"] for m in payload["clusterMethods"]]

    from tehillim_pipeline.analysis import benjamini_hochberg

    expected = benjamini_hochberg(raw_p_values)
    assert adjusted_p_values == pytest.approx(expected)


def test_family_ami_p_value_is_bh_corrected_independently_of_genre():
    payload = _payload()
    raw_p_values = [m["familyAlignment"]["amiPValue"] for m in payload["clusterMethods"]]
    adjusted_p_values = [m["familyAlignment"]["amiPValueAdjusted"] for m in payload["clusterMethods"]]

    from tehillim_pipeline.analysis import benjamini_hochberg

    expected = benjamini_hochberg(raw_p_values)
    assert adjusted_p_values == pytest.approx(expected)


def test_different_methods_can_disagree_on_cluster_assignment():
    # Sanity: the two clusterings in this fixture are deliberately built to
    # disagree (verb-morphology groups {1,2}/{3,4}, person groups {2,3}/{1,4})
    # so a bug that collapsed methods into one shared computation would be
    # caught here.
    payload = _payload()
    person = next(m for m in payload["clusterMethods"] if m["id"] == "person-profile-spectral")
    clusters = {c["index"]: c["psalmNumbers"] for c in person["clusters"]}
    assert clusters == {0: [2, 3], 1: [1, 4]}
