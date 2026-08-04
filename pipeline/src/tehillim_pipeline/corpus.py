"""Load the ETCBC BHSA corpus via Text-Fabric and extract per-psalm word data.

This module is intentionally limited to *extraction*: it turns the BHSA
Text-Fabric dataset into plain, serializable Python objects. Feature
engineering (e.g. deciding which words count as "content words") and
similarity computation live in :mod:`tehillim_pipeline.features` and
:mod:`tehillim_pipeline.similarity`, so that new comparison methods can be
added without touching corpus access at all.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from tf.fabric import Fabric

#: Default location of a locally cloned BHSA Text-Fabric dataset.
#: Override with the TEHILLIM_BHSA_PATH environment variable or the
#: --bhsa-path CLI flag.
DEFAULT_BHSA_TF_PATH = Path.home() / "Developer" / "hebrew" / "bhsa" / "tf" / "2021"

#: Text-Fabric features required for extraction.
_REQUIRED_FEATURES = (
    "otype book chapter verse "
    "lex voc_lex_utf8 g_word_utf8 sp gloss vs vt"
)

_PSALMS_BOOK_NAME = "Psalmi"


@dataclass(frozen=True, slots=True)
class PsalmWord:
    """A single word occurrence within a psalm."""

    node: int
    """Text-Fabric word node id. Kept so later phases (clause/phrase
    structure, disjunctive accents, ...) can re-query the corpus for a word
    without re-running extraction from scratch."""

    lexeme: str
    """Stable ETCBC lexeme identifier (e.g. ``JHWH/``). Used as the unit of
    lexical comparison since it collapses inflected surface forms."""

    lemma: str
    """Vocalized Hebrew dictionary form of the lexeme, for display."""

    surface: str
    """Vocalized Hebrew surface form as it occurs in the text."""

    part_of_speech: str
    """BHSA part-of-speech code (``subs``, ``verb``, ``nmpr``, ...)."""

    gloss: str
    """Short English gloss of the lexeme."""

    verb_stem: str
    """BHSA verb stem/binyan code (e.g. ``piel``, ``hif``), or "" if this
    word is not a verb."""

    verb_mood: str
    """BHSA verb conjugation/mood code (e.g. ``impv``, ``impf``), or "" if
    this word is not a verb."""


@dataclass(frozen=True, slots=True)
class Psalm:
    """A single psalm (one BHSA chapter within the book of Psalms)."""

    number: int
    verse_count: int
    words: tuple[PsalmWord, ...]
    incipit: str
    """Vocalized Hebrew text of the psalm's first verse."""


class Corpus:
    """A loaded Text-Fabric BHSA corpus, scoped to psalm extraction."""

    def __init__(self, api: Any) -> None:
        # Text-Fabric ships no type stubs; `Any` is the honest boundary type
        # for its dynamically-attributed API objects (F, L, T, ...).
        self._api = api

    @classmethod
    def load(cls, tf_path: Path | None = None) -> Corpus:
        """Load the BHSA Text-Fabric dataset from ``tf_path``.

        Raises FileNotFoundError if the dataset is not present, and
        RuntimeError if Text-Fabric fails to load the required features.
        """
        path = tf_path or DEFAULT_BHSA_TF_PATH
        if not path.exists():
            raise FileNotFoundError(
                f"BHSA Text-Fabric data not found at {path}. "
                "Clone https://github.com/ETCBC/bhsa and pass its tf/<version> "
                "directory via --bhsa-path or the TEHILLIM_BHSA_PATH env var."
            )
        tf = Fabric(locations=str(path), silent="deep")
        api = tf.load(_REQUIRED_FEATURES, silent="deep")
        if api is None:
            raise RuntimeError(f"Text-Fabric failed to load required features from {path}")
        return cls(api)

    def psalms(self) -> list[Psalm]:
        """Extract all 150 psalms, in canonical order, as structured data."""
        F, L, T = self._api.F, self._api.L, self._api.T  # noqa: N806

        book_nodes = [b for b in F.otype.s("book") if F.book.v(b) == _PSALMS_BOOK_NAME]
        if not book_nodes:
            raise RuntimeError(f"Book '{_PSALMS_BOOK_NAME}' not found in loaded corpus")

        psalms: list[Psalm] = []
        for chapter_node in L.d(book_nodes[0], otype="chapter"):
            _, psalm_number = T.sectionFromNode(chapter_node)
            word_nodes = L.d(chapter_node, otype="word")
            words = tuple(self._word(node) for node in word_nodes)

            verse_nodes = L.d(chapter_node, otype="verse")
            incipit = T.text(L.d(verse_nodes[0], otype="word")).strip() if verse_nodes else ""

            psalms.append(
                Psalm(
                    number=psalm_number,
                    verse_count=len(verse_nodes),
                    words=words,
                    incipit=incipit,
                )
            )

        psalms.sort(key=lambda p: p.number)
        return psalms

    def _word(self, node: int) -> PsalmWord:
        F = self._api.F  # noqa: N806
        lex_node = self._api.L.u(node, otype="lex")
        gloss = F.gloss.v(lex_node[0]) if lex_node else ""
        return PsalmWord(
            node=node,
            lexeme=F.lex.v(node),
            lemma=F.voc_lex_utf8.v(node),
            surface=F.g_word_utf8.v(node),
            part_of_speech=F.sp.v(node),
            gloss=gloss or "",
            verb_stem=_na_to_empty(F.vs.v(node)),
            verb_mood=_na_to_empty(F.vt.v(node)),
        )


def _na_to_empty(value: str | None) -> str:
    """BHSA uses the literal string "NA" (not None) for inapplicable
    word-level features like verb stem/mood on non-verbs."""
    return "" if value is None or value == "NA" else value
