from __future__ import annotations

from tehillim_pipeline.export_gunkel import build_gunkel_payload
from tehillim_pipeline.gunkel_genre_index import GUNKEL_FAMILIES, GUNKEL_GENRES


def test_payload_has_expected_top_level_keys():
    payload = build_gunkel_payload()
    assert set(payload) == {"generatedAt", "genres", "families", "psalms"}


def test_genres_and_families_match_the_canonical_lists():
    payload = build_gunkel_payload()
    assert payload["genres"] == list(GUNKEL_GENRES)
    assert payload["families"] == list(GUNKEL_FAMILIES)


def test_covers_all_150_psalm_numbers_exactly_once():
    payload = build_gunkel_payload()
    numbers = [p["number"] for p in payload["psalms"]]
    assert numbers == list(range(1, 151))


def test_indexed_psalm_carries_its_genre_and_family():
    payload = build_gunkel_payload()
    psalm_1 = next(p for p in payload["psalms"] if p["number"] == 1)
    assert psalm_1["genre"] == "Wisdom Psalm"
    assert psalm_1["family"] == "Wisdom Psalm"

    psalm_47 = next(p for p in payload["psalms"] if p["number"] == 47)
    assert psalm_47["genre"] == "Enthronement Psalm"
    assert psalm_47["family"] == "Hymn"


def test_excluded_psalm_has_null_genre_and_family():
    payload = build_gunkel_payload()
    psalm_27 = next(p for p in payload["psalms"] if p["number"] == 27)
    assert psalm_27["genre"] is None
    assert psalm_27["family"] is None
