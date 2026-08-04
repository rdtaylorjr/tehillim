"""Named-entity-type feature extraction.

BHSA `nametype` classifies proper names by referent type - person (`pers`),
place (`topo`), people/nation (`gens`), deity (`god`), measurement unit
(`mens`), or demonstrative personal pronoun (`ppde`) - and can be a
comma-joined combination for ambiguous cases (e.g. `pers,gens` for a name
that is both an eponymous ancestor and the people descended from him). An
onomastic profile - how much a psalm leans on personal names vs. place names
vs. divine address - is a distinct axis from lexical or morphological
similarity: a psalm dense with place names (a "geography" psalm like 68 or
grouped enthronement/Zion psalms) reads differently from one dense with
divine epithets alone. Per the BHSA feature docs, this feature is
incompletely and not always correctly assigned, so results should be read
as suggestive rather than definitive. This module builds a psalm x
name-type tag-count FeatureMatrix from a single tag family.
"""

from __future__ import annotations

from tehillim_pipeline.corpus import Psalm, PsalmWord
from tehillim_pipeline.features import FeatureInfo, FeatureMatrix, assemble_feature_matrix

#: BHSA named-entity-type codes -> human-readable labels.
#: https://github.com/ETCBC/bhsa/blob/master/docs/features/nametype.md
_NAME_TYPE_LABELS: dict[str, str] = {
    "gens": "People",
    "god": "Deity",
    "mens": "Measurement Unit",
    "pers": "Person",
    "ppde": "Demonstrative Personal Pronoun",
    "topo": "Place",
}


def named_words(words: tuple[PsalmWord, ...]) -> list[PsalmWord]:
    """Return the subset of `words` marked as a named entity."""
    return [w for w in words if w.name_type]


def _label(name_type: str) -> str:
    parts = name_type.split(",")
    return " / ".join(_NAME_TYPE_LABELS.get(part, part) for part in parts)


def build_named_entity_profile_feature_matrix(psalms: list[Psalm]) -> FeatureMatrix:
    """Build a psalm x name-type tag-count matrix."""
    term_info: dict[str, FeatureInfo] = {}
    per_psalm_counts: list[dict[str, int]] = []

    for psalm in psalms:
        counts: dict[str, int] = {}
        for word in named_words(psalm.words):
            tag = word.name_type
            counts[tag] = counts.get(tag, 0) + 1
            term_info.setdefault(
                tag,
                FeatureInfo(
                    label=_label(tag),
                    description=f"Named entity: {_label(tag)}",
                    category="named-entity",
                ),
            )
        per_psalm_counts.append(counts)

    return assemble_feature_matrix(psalms, per_psalm_counts, term_info)
