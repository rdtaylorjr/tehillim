"""Integration tests against the real BHSA Text-Fabric dataset.

Automatically skipped if TEHILLIM_BHSA_PATH / DEFAULT_BHSA_TF_PATH isn't
available locally (see conftest.py).
"""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.integration


def test_extracts_all_150_psalms_in_order(psalms):
    assert len(psalms) == 150
    assert [p.number for p in psalms] == list(range(1, 151))


def test_psalm_1_has_six_verses(psalms):
    psalm_1 = next(p for p in psalms if p.number == 1)
    assert psalm_1.verse_count == 6


def test_psalm_119_is_the_longest_by_word_count(psalms):
    longest = max(psalms, key=lambda p: len(p.words))
    assert longest.number == 119


def test_every_psalm_has_words_and_an_incipit(psalms):
    assert all(p.words for p in psalms)
    assert all(p.incipit for p in psalms)


def test_divine_name_yhwh_is_tagged_as_proper_noun(psalms):
    all_words = [w for p in psalms for w in p.words]
    yhwh_words = [w for w in all_words if w.lexeme == "JHWH/"]
    assert yhwh_words
    assert all(w.part_of_speech == "nmpr" for w in yhwh_words)


def test_words_carry_nonempty_display_fields(psalms):
    sample = psalms[0].words[0]
    assert sample.lemma
    assert sample.surface
    assert sample.part_of_speech
