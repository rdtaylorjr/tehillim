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


def test_words_carry_a_unique_text_fabric_node_id(psalms):
    all_words = [w for p in psalms for w in p.words]
    node_ids = [w.node for w in all_words]
    assert all(isinstance(n, int) and n > 0 for n in node_ids)
    assert len(set(node_ids)) == len(node_ids)


def test_psalm_150_is_dominated_by_piel_imperative_praise_verbs(psalms):
    # "הַלְלוּ" (praise!) repeated throughout - the textbook example of the
    # imperative-heavy hymnic form the verb-morphology method targets.
    psalm_150 = next(p for p in psalms if p.number == 150)
    verbs = [w for w in psalm_150.words if w.part_of_speech == "verb"]
    assert verbs
    piel_imperatives = [w for w in verbs if w.verb_stem == "piel" and w.verb_mood == "impv"]
    assert len(piel_imperatives) / len(verbs) > 0.5


def test_non_verb_words_have_empty_verb_stem_and_mood(psalms):
    non_verbs = [w for p in psalms for w in p.words if w.part_of_speech != "verb"]
    assert non_verbs
    assert all(w.verb_stem == "" and w.verb_mood == "" for w in non_verbs)


def test_verb_words_have_nonempty_verb_stem_and_mood(psalms):
    verbs = [w for p in psalms for w in p.words if w.part_of_speech == "verb"]
    assert verbs
    assert all(w.verb_stem != "" and w.verb_mood != "" for w in verbs)
