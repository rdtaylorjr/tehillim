from __future__ import annotations

import numpy as np

from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.export import build_payload
from tehillim_pipeline.features import FeatureMatrix, LexemeInfo
from tehillim_pipeline.similarity import SimilarityResult


def _payload_inputs():
    psalms = [
        Psalm(number=1, verse_count=2, incipit="אשרי", words=()),
        Psalm(number=2, verse_count=3, incipit="למה", words=()),
        Psalm(number=3, verse_count=1, incipit="יהוה", words=()),
    ]
    lexemes = ("MLK/", "YD/")
    lexeme_info = {
        "MLK/": LexemeInfo(lemma="מֶלֶךְ", gloss="king", part_of_speech="subs"),
        "YD/": LexemeInfo(lemma="יָד", gloss="hand", part_of_speech="subs"),
    }
    counts = np.array([[2, 1], [1, 0], [0, 3]], dtype=np.int32)
    features = FeatureMatrix(
        psalm_numbers=(1, 2, 3), lexemes=lexemes, counts=counts, lexeme_info=lexeme_info
    )
    weights = counts.astype(float)
    matrix = np.array(
        [
            [1.0, 0.6, 0.1],
            [0.6, 1.0, 0.05],
            [0.1, 0.05, 1.0],
        ]
    )
    result = SimilarityResult(
        method="lexical-tfidf-cosine",
        description="test method",
        psalm_numbers=(1, 2, 3),
        matrix=matrix,
    )
    return psalms, features, weights, result


def test_payload_has_expected_top_level_keys():
    payload = build_payload(*_payload_inputs())
    assert set(payload) == {"meta", "psalmNumbers", "psalms", "similar", "matrix"}


def test_payload_meta_reflects_method_and_psalm_count():
    payload = build_payload(*_payload_inputs())
    assert payload["meta"]["method"] == "lexical-tfidf-cosine"
    assert payload["meta"]["psalmCount"] == 3
    assert payload["meta"]["corpus"] == {"name": "ETCBC/BHSA", "version": "2021"}


def test_similar_psalms_exclude_self():
    payload = build_payload(*_payload_inputs())
    entries = payload["similar"]["1"]
    assert all(entry["psalm"] != 1 for entry in entries)


def test_similar_psalms_are_ranked_descending_by_score():
    payload = build_payload(*_payload_inputs())
    entries = payload["similar"]["1"]
    scores = [entry["score"] for entry in entries]
    assert scores == sorted(scores, reverse=True)
    assert entries[0]["psalm"] == 2


def test_matrix_is_square_and_matches_psalm_count():
    payload = build_payload(*_payload_inputs())
    assert len(payload["matrix"]) == 3
    assert all(len(row) == 3 for row in payload["matrix"])


def test_shared_lexemes_only_include_lexemes_present_in_both_psalms():
    payload = build_payload(*_payload_inputs())
    # Psalm 1 has MLK/+YD/; Psalm 3 (weakest match) has only YD/.
    weakest_match = payload["similar"]["1"][-1]
    assert weakest_match["psalm"] == 3
    assert all(lex["lemma"] == "יָד" for lex in weakest_match["sharedLexemes"])


def test_psalm_payload_includes_expected_display_fields():
    payload = build_payload(*_payload_inputs())
    p1 = payload["psalms"][0]
    assert p1["number"] == 1
    assert p1["verseCount"] == 2
    assert p1["incipit"] == "אשרי"
    assert p1["uniqueLexemeCount"] == 2
    assert p1["contentWordCount"] == 3


def test_top_lexemes_exclude_zero_score_lexemes():
    payload = build_payload(*_payload_inputs())
    p2 = payload["psalms"][1]  # counts [1, 0] -> only MLK/ has weight
    assert len(p2["topLexemes"]) == 1
    assert p2["topLexemes"][0]["lemma"] == "מֶלֶךְ"


def test_scores_are_rounded_floats():
    payload = build_payload(*_payload_inputs())
    for entry in payload["similar"]["1"]:
        assert isinstance(entry["score"], float)
