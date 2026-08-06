"""Command-line entrypoint: extract psalms, compute every similarity
method, and write the combined JSON payload.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Callable
from pathlib import Path

from tehillim_pipeline.clause_relation_profile import build_clause_relation_feature_matrix
from tehillim_pipeline.clause_type_profile import build_clause_type_feature_matrix
from tehillim_pipeline.cluster_methods import (
    CLAUSE_RELATION_CLUSTERING,
    CLAUSE_TYPE_CLUSTERING,
    LEXICAL_CLUSTERING,
    LEXICAL_SET_CLUSTERING,
    NAMED_ENTITY_CLUSTERING,
    NAMED_ENTITY_IDENTITY_CLUSTERING,
    PERSON_PROFILE_CLUSTERING,
    ROOT_CLUSTERING,
    TEXT_TYPE_CLUSTERING,
    VERB_MORPHOLOGY_CLUSTERING,
    VERB_SENSE_CLUSTERING,
)
from tehillim_pipeline.clustering import ClusteringMethod
from tehillim_pipeline.corpus import DEFAULT_BHSA_TF_PATH, DEFAULT_VALENCE_TF_PATH, Corpus, Psalm
from tehillim_pipeline.embedding import compute_embedding
from tehillim_pipeline.export import MethodComputation, build_similarity_payload
from tehillim_pipeline.export_clustering import build_clustering_payload
from tehillim_pipeline.export_gunkel import build_gunkel_payload
from tehillim_pipeline.features import FeatureMatrix, build_lexical_feature_matrix
from tehillim_pipeline.lexical_set import build_lexical_set_feature_matrix
from tehillim_pipeline.methods import (
    CLAUSE_RELATION_SIMILARITY,
    CLAUSE_TYPE_SIMILARITY,
    LEXICAL_SET_SIMILARITY,
    LEXICAL_SIMILARITY,
    NAMED_ENTITY_IDENTITY_SIMILARITY,
    NAMED_ENTITY_SIMILARITY,
    PERSON_PROFILE_SIMILARITY,
    ROOT_SIMILARITY,
    TEXT_TYPE_SIMILARITY,
    VERB_MORPHOLOGY_SIMILARITY,
    VERB_SENSE_SIMILARITY,
)
from tehillim_pipeline.named_entity_identity import build_named_entity_identity_feature_matrix
from tehillim_pipeline.named_entity_profile import build_named_entity_profile_feature_matrix
from tehillim_pipeline.person_profile import build_person_profile_feature_matrix
from tehillim_pipeline.root_similarity import build_root_feature_matrix
from tehillim_pipeline.similarity import SimilarityMethod, tfidf_weights
from tehillim_pipeline.text_type_profile import build_text_type_feature_matrix
from tehillim_pipeline.verb_morphology import build_verb_morphology_feature_matrix
from tehillim_pipeline.verb_sense_profile import build_verb_sense_feature_matrix

#: repo_root/app/public/data/similarity.json
DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / "app" / "public" / "data" / "similarity.json"

#: repo_root/app/public/data/clustering.json
DEFAULT_CLUSTER_OUTPUT = (
    Path(__file__).resolve().parents[3] / "app" / "public" / "data" / "clustering.json"
)

#: repo_root/app/public/data/gunkel.json
DEFAULT_GUNKEL_OUTPUT = (
    Path(__file__).resolve().parents[3] / "app" / "public" / "data" / "gunkel.json"
)

#: Every similarity method exported to the frontend, in display order. The
#: first is used as the frontend's default. Adding a new TF-IDF-cosine-style
#: method (a new feature extractor paired with a `methods.py` instance) is a
#: one-line addition here. Grouped lexical/vocabulary-based methods first,
#: then syntactic/grammatical-profile, then clause/phrase-structure methods -
#: see methods.py's docstring for which configured methods are deliberately
#: NOT listed here (measured near-degenerate under TF-IDF-cosine).
_METHODS: tuple[tuple[Callable[[list[Psalm]], FeatureMatrix], SimilarityMethod], ...] = (
    (build_lexical_feature_matrix, LEXICAL_SIMILARITY),
    (build_root_feature_matrix, ROOT_SIMILARITY),
    (build_named_entity_identity_feature_matrix, NAMED_ENTITY_IDENTITY_SIMILARITY),
    (build_verb_morphology_feature_matrix, VERB_MORPHOLOGY_SIMILARITY),
    (build_person_profile_feature_matrix, PERSON_PROFILE_SIMILARITY),
    (build_lexical_set_feature_matrix, LEXICAL_SET_SIMILARITY),
    (build_named_entity_profile_feature_matrix, NAMED_ENTITY_SIMILARITY),
    (build_clause_type_feature_matrix, CLAUSE_TYPE_SIMILARITY),
    (build_text_type_feature_matrix, TEXT_TYPE_SIMILARITY),
    (build_clause_relation_feature_matrix, CLAUSE_RELATION_SIMILARITY),
    (build_verb_sense_feature_matrix, VERB_SENSE_SIMILARITY),
)

#: Every clustering method exported to the frontend's Cluster page, paired
#: with the name of the already-computed similarity method whose matrix it
#: clusters (see clustering.py's module docstring on why clustering
#: consumes a SimilarityResult rather than building its own features from
#: scratch). The first is used as the frontend's default. Per the project's
#: explicit sequencing decision, this is a per-signal pass - one
#: independent clustering per shipped signal, no cross-signal fusion yet.
#: Mirrors `_METHODS`' order and, deliberately, its full membership: every
#: shipped similarity method gets a clustering (see cluster_methods.py's
#: docstring on why the lexical family's clusters are thematic, not genre).
_CLUSTER_METHODS: tuple[tuple[str, ClusteringMethod], ...] = (
    (LEXICAL_SIMILARITY.name, LEXICAL_CLUSTERING),
    (ROOT_SIMILARITY.name, ROOT_CLUSTERING),
    (NAMED_ENTITY_IDENTITY_SIMILARITY.name, NAMED_ENTITY_IDENTITY_CLUSTERING),
    (VERB_MORPHOLOGY_SIMILARITY.name, VERB_MORPHOLOGY_CLUSTERING),
    (PERSON_PROFILE_SIMILARITY.name, PERSON_PROFILE_CLUSTERING),
    (LEXICAL_SET_SIMILARITY.name, LEXICAL_SET_CLUSTERING),
    (NAMED_ENTITY_SIMILARITY.name, NAMED_ENTITY_CLUSTERING),
    (CLAUSE_TYPE_SIMILARITY.name, CLAUSE_TYPE_CLUSTERING),
    (TEXT_TYPE_SIMILARITY.name, TEXT_TYPE_CLUSTERING),
    (CLAUSE_RELATION_SIMILARITY.name, CLAUSE_RELATION_CLUSTERING),
    (VERB_SENSE_SIMILARITY.name, VERB_SENSE_CLUSTERING),
)

#: Default clustering shown on page load: syntactic similarity (person).
_DEFAULT_CLUSTER_METHOD = PERSON_PROFILE_CLUSTERING.name


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    env_bhsa_path = os.environ.get("TEHILLIM_BHSA_PATH")
    parser.add_argument(
        "--bhsa-path",
        type=Path,
        default=Path(env_bhsa_path) if env_bhsa_path else None,
        help=f"Path to a BHSA Text-Fabric tf/<version> directory (default: {DEFAULT_BHSA_TF_PATH})",
    )
    env_valence_path = os.environ.get("TEHILLIM_VALENCE_PATH")
    parser.add_argument(
        "--valence-path",
        type=Path,
        default=Path(env_valence_path) if env_valence_path else None,
        help=(
            "Path to an ETCBC/valence Text-Fabric tf/<version> directory "
            f"(default: {DEFAULT_VALENCE_TF_PATH})"
        ),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output JSON path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--cluster-output",
        type=Path,
        default=DEFAULT_CLUSTER_OUTPUT,
        help=f"Clustering output JSON path (default: {DEFAULT_CLUSTER_OUTPUT})",
    )
    parser.add_argument(
        "--gunkel-output",
        type=Path,
        default=DEFAULT_GUNKEL_OUTPUT,
        help=f"Gunkel reference output JSON path (default: {DEFAULT_GUNKEL_OUTPUT})",
    )
    return parser.parse_args(argv)


def run(
    bhsa_path: Path | None,
    valence_path: Path | None,
    output: Path,
    cluster_output: Path,
    gunkel_output: Path,
) -> None:
    print("Loading BHSA corpus via Text-Fabric...", file=sys.stderr)
    corpus = Corpus.load(bhsa_path, valence_path)

    print("Extracting psalms...", file=sys.stderr)
    psalms = corpus.psalms()
    if len(psalms) != 150:
        print(f"warning: expected 150 psalms, found {len(psalms)}", file=sys.stderr)

    computations = []
    for build_features, method in _METHODS:
        print(f"Computing {method.name}...", file=sys.stderr)
        features = build_features(psalms)
        weights = tfidf_weights(features)
        result = method.compute(features)
        computations.append(MethodComputation(features=features, weights=weights, result=result))

    print("Building export payload...", file=sys.stderr)
    payload = build_similarity_payload(
        psalms=psalms, computations=computations, default_method=_METHODS[0][1].name
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    output.write_text(serialized, encoding="utf-8")
    print(f"Wrote {output} ({output.stat().st_size / 1024:.0f} KiB)", file=sys.stderr)

    similarity_by_name = {
        computation.result.method: computation.result for computation in computations
    }
    cluster_results = []
    cluster_embeddings = []
    for similarity_name, cluster_method in _CLUSTER_METHODS:
        print(f"Clustering {cluster_method.name}...", file=sys.stderr)
        similarity = similarity_by_name[similarity_name]
        cluster_results.append(cluster_method.compute(similarity))
        cluster_embeddings.append(compute_embedding(similarity))

    print("Building clustering payload...", file=sys.stderr)
    cluster_payload = build_clustering_payload(
        psalms=psalms,
        results=cluster_results,
        embeddings=cluster_embeddings,
        default_method=_DEFAULT_CLUSTER_METHOD,
    )

    cluster_output.parent.mkdir(parents=True, exist_ok=True)
    cluster_serialized = json.dumps(cluster_payload, ensure_ascii=False, separators=(",", ":"))
    cluster_output.write_text(cluster_serialized, encoding="utf-8")
    print(
        f"Wrote {cluster_output} ({cluster_output.stat().st_size / 1024:.0f} KiB)", file=sys.stderr
    )

    print("Building Gunkel reference payload...", file=sys.stderr)
    gunkel_payload = build_gunkel_payload()
    gunkel_output.parent.mkdir(parents=True, exist_ok=True)
    gunkel_serialized = json.dumps(gunkel_payload, ensure_ascii=False, separators=(",", ":"))
    gunkel_output.write_text(gunkel_serialized, encoding="utf-8")
    print(f"Wrote {gunkel_output} ({gunkel_output.stat().st_size / 1024:.0f} KiB)", file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    run(args.bhsa_path, args.valence_path, args.output, args.cluster_output, args.gunkel_output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
