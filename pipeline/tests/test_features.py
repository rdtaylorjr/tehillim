from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import CONTENT_POS, build_feature_matrix, content_words


def _word(lexeme: str, pos: str = "subs", lemma: str | None = None, gloss: str = "") -> PsalmWord:
    return PsalmWord(
        lexeme=lexeme, lemma=lemma or lexeme, surface=lexeme, part_of_speech=pos, gloss=gloss
    )


def test_content_words_excludes_closed_class_pos():
    words = (_word("MLK/", pos="subs"), _word("W", pos="conj"), _word("B", pos="prep"))
    assert [w.lexeme for w in content_words(words)] == ["MLK/"]


def test_content_words_keeps_every_content_pos_category():
    words = tuple(_word(f"L{i}", pos=pos) for i, pos in enumerate(sorted(CONTENT_POS)))
    assert len(content_words(words)) == len(words)


def test_content_words_preserves_input_order():
    words = (_word("A"), _word("W", pos="conj"), _word("B"))
    assert [w.lexeme for w in content_words(words)] == ["A", "B"]


def test_build_feature_matrix_counts_lexeme_occurrences():
    psalms = [
        Psalm(
            number=1,
            verse_count=1,
            incipit="",
            words=(_word("MLK/"), _word("MLK/"), _word("YD/")),
        ),
        Psalm(number=2, verse_count=1, incipit="", words=(_word("MLK/"),)),
    ]
    fm = build_feature_matrix(psalms)

    assert fm.psalm_numbers == (1, 2)
    assert set(fm.lexemes) == {"MLK/", "YD/"}

    mlk_col = fm.lexemes.index("MLK/")
    yd_col = fm.lexemes.index("YD/")
    assert fm.counts[0, mlk_col] == 2
    assert fm.counts[0, yd_col] == 1
    assert fm.counts[1, mlk_col] == 1
    assert fm.counts[1, yd_col] == 0


def test_build_feature_matrix_excludes_function_words_from_vocabulary():
    psalms = [
        Psalm(number=1, verse_count=1, incipit="", words=(_word("MLK/"), _word("W", pos="conj")))
    ]
    fm = build_feature_matrix(psalms)
    assert "W" not in fm.lexemes


def test_build_feature_matrix_records_lexeme_display_info():
    psalms = [
        Psalm(
            number=1,
            verse_count=1,
            incipit="",
            words=(_word("MLK/", lemma="מֶלֶךְ", gloss="king"),),
        )
    ]
    fm = build_feature_matrix(psalms)
    info = fm.lexeme_info["MLK/"]
    assert info.lemma == "מֶלֶךְ"
    assert info.gloss == "king"
    assert info.part_of_speech == "subs"


def test_build_feature_matrix_handles_psalm_with_no_content_words():
    psalms = [Psalm(number=1, verse_count=1, incipit="", words=(_word("W", pos="conj"),))]
    fm = build_feature_matrix(psalms)
    assert fm.lexemes == ()
    assert fm.counts.shape == (1, 0)


def test_build_feature_matrix_handles_empty_psalm_list():
    fm = build_feature_matrix([])
    assert fm.psalm_numbers == ()
    assert fm.lexemes == ()
    assert fm.counts.shape == (0, 0)


def test_build_feature_matrix_lexemes_are_sorted_and_deduplicated():
    psalms = [
        Psalm(number=1, verse_count=1, incipit="", words=(_word("Z/"), _word("A/"), _word("Z/")))
    ]
    fm = build_feature_matrix(psalms)
    assert fm.lexemes == ("A/", "Z/")
