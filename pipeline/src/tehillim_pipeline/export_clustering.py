"""Serialize psalms and one or more clustering results into the JSON
payload consumed by the frontend's Genre page.

Mirrors export.py's shape and role, but for a partition of the corpus
rather than a pairwise similarity matrix - a genuinely different result
shape (see clustering.py's module docstring), so it gets its own payload
file (clustering.json) rather than a new key bolted onto similarity.json.
Reuses export.py's `psalm_core` for the method-independent psalm facts so
both payloads agree on that shape without duplicating it.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from tehillim_pipeline.analysis import benjamini_hochberg
from tehillim_pipeline.clustering import ClusteringResult
from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.embedding import Embedding2D
from tehillim_pipeline.export import CORPUS_SOURCE, psalm_core
from tehillim_pipeline.genre_alignment import (
    GenreAlignment,
    compute_family_alignment,
    compute_genre_alignment,
)


def build_clustering_payload(
    psalms: list[Psalm],
    results: list[ClusteringResult],
    embeddings: list[Embedding2D],
    default_method: str,
    *,
    ami_permutations: int = 2000,
) -> dict[str, Any]:
    """Assemble the full JSON-serializable clustering payload for the
    frontend's Genre page.

    Every shipped signal runs its own AMI-permutation significance test
    (`genre_alignment.GenreAlignment.ami_p_value`) - eleven independent
    tests of "does this signal's clustering recover Gunkel's genres,"
    which needs the same Benjamini-Hochberg correction already applied to
    the exemplar-cohesion battery (`analysis.benjamini_hochberg`), not
    eleven p-values each read as if it were the only test run. Applied
    here, across all signals together, once every signal's own alignment
    has been computed - the one place that actually has all eleven in
    hand at once. `ami_permutations` is exposed (rather than hardcoded)
    so tests can ask for far fewer than the production default and stay
    fast - a real cost of a real statistical test, not something to
    silently skip in tests.
    """
    cluster_methods = [
        _cluster_method_payload(result, embedding, ami_permutations=ami_permutations)
        for result, embedding in zip(results, embeddings, strict=True)
    ]
    _attach_adjusted_ami_p_values(cluster_methods, alignment_key="genreAlignment")
    _attach_adjusted_ami_p_values(cluster_methods, alignment_key="familyAlignment")

    return {
        "generatedAt": datetime.now(UTC).isoformat(timespec="seconds"),
        "corpus": CORPUS_SOURCE,
        "psalms": [psalm_core(psalm) for psalm in psalms],
        "clusterMethods": cluster_methods,
        "defaultClusterMethod": default_method,
    }


def _attach_adjusted_ami_p_values(
    cluster_methods: list[dict[str, Any]], *, alignment_key: str
) -> None:
    raw_p_values = [method[alignment_key]["amiPValue"] for method in cluster_methods]
    adjusted = benjamini_hochberg(raw_p_values)
    for method, adjusted_p_value in zip(cluster_methods, adjusted, strict=True):
        method[alignment_key]["amiPValueAdjusted"] = adjusted_p_value


def _cluster_method_payload(
    result: ClusteringResult, embedding: Embedding2D, *, ami_permutations: int = 2000
) -> dict[str, Any]:
    if embedding.psalm_numbers != result.psalm_numbers:
        raise ValueError(
            f"embedding psalm_numbers for {embedding.method!r} don't match "
            f"clustering psalm_numbers for {result.method!r}"
        )
    assignments = {
        str(psalm_number): label
        for psalm_number, label in zip(result.psalm_numbers, result.labels, strict=True)
    }

    members: dict[int, list[int]] = {index: [] for index in range(result.n_clusters)}
    for psalm_number, label in zip(result.psalm_numbers, result.labels, strict=True):
        members[label].append(psalm_number)

    clusters = [
        {"index": index, "size": len(psalm_numbers), "psalmNumbers": psalm_numbers}
        for index, psalm_numbers in sorted(members.items())
    ]

    return {
        "id": result.method,
        "description": result.description,
        "nClusters": result.n_clusters,
        "partitionPValue": result.partition_p_value,
        "kStability": result.k_stability,
        "assignments": assignments,
        "clusters": clusters,
        "embedding": {
            "x": list(embedding.x),
            "y": list(embedding.y),
            "structureCaptured": embedding.structure_captured,
        },
        "genreAlignment": _alignment_payload(
            compute_genre_alignment(result, ami_permutations=ami_permutations)
        ),
        "familyAlignment": _alignment_payload(
            compute_family_alignment(result, ami_permutations=ami_permutations)
        ),
    }


def _alignment_payload(alignment: GenreAlignment) -> dict[str, Any]:
    return {
        "genres": list(alignment.genres),
        "counts": [list(row) for row in alignment.counts],
        "genreTotals": list(alignment.genre_totals),
        "clusterGenreLabels": list(alignment.cluster_genre_labels),
        "purity": alignment.purity,
        "ami": alignment.ami,
        "ari": alignment.ari,
        "amiPValue": alignment.ami_p_value,
    }
