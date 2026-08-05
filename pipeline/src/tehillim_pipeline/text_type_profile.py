"""Text-type feature extraction.

BHSA `txt` classifies each clause's discourse register: Narrative,
Discursive (author addressing the reader directly), or Quotation, with
embedding shown by repeated characters (e.g. `QND` = discursive material
inside a narrative frame, itself inside a quotation). This is BHSA's
closest analogue to a discourse-type feature - there is no separate
"discourse" object type in the corpus (checked directly: `sentence`,
`sentence_atom`, and `half_verse` carry no independent content tags at
all). A quotation-heavy psalm (direct divine speech embedded in address to
God) reads differently from a narrative-heavy one (recounting past acts).
This module builds a psalm x text-type tag-count FeatureMatrix, treating
each distinct nesting sequence (not just the top-level letter) as its own
term, denormalized from each word's enclosing clause.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA text-type single-character codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/txt.md
_TEXT_TYPE_CHAR_LABELS: dict[str, str] = {
    "?": "Unknown",
    "N": "Narrative",
    "D": "Discursive",
    "Q": "Quotation",
}


def text_typed_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` carrying a text-type tag."""
    return [w for w in words if w.text_type]


def _label(tag: str) -> str:
    if len(tag) == 1:
        return _TEXT_TYPE_CHAR_LABELS.get(tag, tag)
    chain = " within ".join(_TEXT_TYPE_CHAR_LABELS.get(c, c) for c in tag)
    return chain


def build_text_type_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x text-type tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in text_typed_words(psalm.words):
            tag = word.text_type
            counts[tag] = counts.get(tag, 0) + 1
            term_info.setdefault(
                tag,
                FeatureInfo(label=tag, description=_label(tag), category="text-type"),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
