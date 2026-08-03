"""Serialize psalms and a similarity result into the JSON payload consumed
by the frontend visualization app.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import numpy as np

from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.features import FeatureMatrix
from tehillim_pipeline.similarity import SimilarityResult

#: Number of top similar psalms to precompute per psalm.
TOP_SIMILAR_COUNT = 12
#: Number of top distinctive lexemes to include per psalm.
TOP_LEXEMES_COUNT = 8
#: Number of shared lexemes used to explain each similar-psalm pairing.
SHARED_LEXEMES_COUNT = 6

CORPUS_SOURCE = {"name": "ETCBC/BHSA", "version": "2021"}


def build_payload(
    psalms: list[Psalm],
    features: FeatureMatrix,
    weights: np.ndarray,
    result: SimilarityResult,
) -> dict[str, Any]:
    """Assemble the full JSON-serializable payload for the frontend."""

    def lexeme_payload(col: int, score: float) -> dict[str, Any]:
        lex = features.lexemes[col]
        info = features.lexeme_info[lex]
        return {
            "lemma": info.lemma,
            "gloss": info.gloss,
            "pos": info.part_of_speech,
            "score": round(float(score), 4),
        }

    def top_lexeme_columns(row: int) -> list[int]:
        order = np.argsort(weights[row])[::-1]
        return [int(i) for i in order[:TOP_LEXEMES_COUNT] if weights[row, i] > 0]

    psalm_payloads = []
    for row, psalm in enumerate(psalms):
        psalm_payloads.append(
            {
                "number": psalm.number,
                "verseCount": psalm.verse_count,
                "wordCount": len(psalm.words),
                "contentWordCount": int(features.counts[row].sum()),
                "uniqueLexemeCount": int(np.count_nonzero(features.counts[row])),
                "incipit": psalm.incipit,
                "topLexemes": [
                    lexeme_payload(col, weights[row, col]) for col in top_lexeme_columns(row)
                ],
            }
        )

    similar_by_psalm: dict[str, list[dict[str, Any]]] = {}
    for row, psalm in enumerate(psalms):
        order = np.argsort(result.matrix[row])[::-1]
        ranked_rows = [int(r) for r in order if r != row][:TOP_SIMILAR_COUNT]

        entries = []
        for other_row in ranked_rows:
            shared_cols = np.flatnonzero(
                (features.counts[row] > 0) & (features.counts[other_row] > 0)
            )
            shared_strength = np.minimum(weights[row, shared_cols], weights[other_row, shared_cols])
            best = np.argsort(shared_strength)[::-1][:SHARED_LEXEMES_COUNT]
            entries.append(
                {
                    "psalm": psalms[other_row].number,
                    "score": round(float(result.matrix[row, other_row]), 4),
                    "sharedLexemes": [
                        lexeme_payload(int(shared_cols[i]), shared_strength[i]) for i in best
                    ],
                }
            )
        similar_by_psalm[str(psalm.number)] = entries

    return {
        "meta": {
            "method": result.method,
            "description": result.description,
            "corpus": CORPUS_SOURCE,
            "generatedAt": datetime.now(UTC).isoformat(timespec="seconds"),
            "psalmCount": len(psalms),
        },
        "psalmNumbers": list(result.psalm_numbers),
        "psalms": psalm_payloads,
        "similar": similar_by_psalm,
        "matrix": [[round(float(v), 3) for v in row] for row in result.matrix],
    }
