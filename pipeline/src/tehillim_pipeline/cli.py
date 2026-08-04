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

from tehillim_pipeline.corpus import DEFAULT_BHSA_TF_PATH, Corpus, Psalm
from tehillim_pipeline.export import MethodComputation, build_similarity_payload
from tehillim_pipeline.features import FeatureMatrix, build_lexical_feature_matrix
from tehillim_pipeline.methods import LEXICAL_SIMILARITY, VERB_MORPHOLOGY_SIMILARITY
from tehillim_pipeline.similarity import SimilarityMethod, tfidf_weights
from tehillim_pipeline.verb_morphology import build_verb_morphology_feature_matrix

#: repo_root/app/public/data/similarity.json
DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / "app" / "public" / "data" / "similarity.json"

#: Every similarity method exported to the frontend, in display order. The
#: first is used as the frontend's default. Adding a new TF-IDF-cosine-style
#: method (a new feature extractor paired with a `methods.py` instance) is a
#: one-line addition here.
_METHODS: tuple[tuple[Callable[[list[Psalm]], FeatureMatrix], SimilarityMethod], ...] = (
    (build_lexical_feature_matrix, LEXICAL_SIMILARITY),
    (build_verb_morphology_feature_matrix, VERB_MORPHOLOGY_SIMILARITY),
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    env_bhsa_path = os.environ.get("TEHILLIM_BHSA_PATH")
    parser.add_argument(
        "--bhsa-path",
        type=Path,
        default=Path(env_bhsa_path) if env_bhsa_path else None,
        help=f"Path to a BHSA Text-Fabric tf/<version> directory (default: {DEFAULT_BHSA_TF_PATH})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output JSON path (default: {DEFAULT_OUTPUT})",
    )
    return parser.parse_args(argv)


def run(bhsa_path: Path | None, output: Path) -> None:
    print("Loading BHSA corpus via Text-Fabric...", file=sys.stderr)
    corpus = Corpus.load(bhsa_path)

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


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    run(args.bhsa_path, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
