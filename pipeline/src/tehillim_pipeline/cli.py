"""Command-line entrypoint: extract psalms, compute similarity, write JSON."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from tehillim_pipeline.corpus import DEFAULT_BHSA_TF_PATH, Corpus
from tehillim_pipeline.export import build_payload
from tehillim_pipeline.features import build_feature_matrix
from tehillim_pipeline.similarity import LexicalTfidfCosine, tfidf_weights

#: repo_root/app/public/data/similarity.json
DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / "app" / "public" / "data" / "similarity.json"


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

    print("Building feature matrix...", file=sys.stderr)
    features = build_feature_matrix(psalms)

    print("Computing lexical similarity...", file=sys.stderr)
    weights = tfidf_weights(features)
    result = LexicalTfidfCosine().compute(features)

    print("Building export payload...", file=sys.stderr)
    payload = build_payload(psalms, features, weights, result)

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
