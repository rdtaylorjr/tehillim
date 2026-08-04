"""Configured similarity methods: a metric (similarity.py) paired with the
name/description of the vocabulary it's being applied to.

This is the composition layer, and deliberately the only module that
imports both a metric and a feature extractor. features.py and
verb_morphology.py know nothing about similarity metrics; similarity.py
knows nothing about specific vocabularies. Callers (cli.py, tests) get one
place to obtain a ready-to-use, fully configured method.

Grouped into two families: lexical/vocabulary-based methods (compare which
specific words appear) and syntactic/grammatical-profile methods (compare
how words are used, independent of vocabulary). `cli.py`'s `_METHODS` tuple
is what actually determines which methods ship in the app - not every
method configured here is wired in there. `GENDER_PROFILE_SIMILARITY`,
`NOMINAL_STATE_SIMILARITY`, and `PHRASE_DEPENDENT_POS_SIMILARITY` are kept
here (and their extractors and tests still exist) but are NOT shipped: a
real analysis run showed TF-IDF-cosine over these three tag profiles is
structurally near-degenerate (>=99% of psalm pairs score above 0.8) because
each has few tags with one dominant category that varies little across the
whole Psalter - see their integration tests, which now document that
finding directly rather than pretending it's a usable comparison method.
The extraction itself is correct and may be useful analyzed a different way
(e.g. intra-psalm sequential change-point detection instead of whole-psalm
averaging) - see the project's method-evaluation notes.
"""

from __future__ import annotations

from tehillim_pipeline.similarity import TfidfCosineSimilarity

# --- Lexical / vocabulary-based: compare which specific words appear ------

LEXICAL_SIMILARITY = TfidfCosineSimilarity(
    name="lexical-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over shared Biblical Hebrew "
        "content-word lexemes (nouns, verbs, adjectives, adverbs, proper "
        "nouns, interjections)."
    ),
)

ROOT_SIMILARITY = TfidfCosineSimilarity(
    name="root-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over shared triliteral "
        "consonantal roots - a coarser cousin of lexical similarity that "
        "credits shared thematic vocabulary across derivationally related "
        "words (e.g. a verb and its cognate noun) that `lexeme` keeps "
        "distinct."
    ),
)

NAMED_ENTITY_IDENTITY_SIMILARITY = TfidfCosineSimilarity(
    name="named-entity-identity-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity restricted to proper-noun "
        "lexemes (personal names, place names, ...) - isolates which "
        "specific named entities two psalms share (e.g. both naming Zion), "
        "distinct from the type-only named-entity method and from general "
        "lexical similarity, where names are diluted among ~2100 other "
        "terms."
    ),
)

# --- Syntactic / grammatical-profile: compare how words are used ----------

VERB_MORPHOLOGY_SIMILARITY = TfidfCosineSimilarity(
    name="verb-morphology-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over verb stem and mood/"
        "conjugation tag frequency profiles - a form-critical genre "
        "fingerprint (Gunkel), not a lexical-overlap measure."
    ),
)

PERSON_PROFILE_SIMILARITY = TfidfCosineSimilarity(
    name="person-profile-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over grammatical-person tag "
        "frequency profiles (word-level and pronominal-suffix person and "
        "number) - individual vs. communal address, a classical "
        "form-critical marker distinct from verb morphology."
    ),
)

LEXICAL_SET_SIMILARITY = TfidfCosineSimilarity(
    name="lexical-set-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over lexical-set tag frequency "
        "profiles (numerals, focus particles, words grammaticalized into "
        "prepositions/adverbs/copulas, ...) - a finer subclassification of "
        "part-of-speech than `sp`."
    ),
)

NAMED_ENTITY_SIMILARITY = TfidfCosineSimilarity(
    name="named-entity-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over named-entity *type* tag "
        "frequency profiles (person, place, people/nation, deity, ...) - "
        "an onomastic register (e.g. place-name-dense vs. person-name-dense), "
        "not which specific names appear. See named-entity-identity for that."
    ),
)

# --- Retired: kept for their own tests, not shipped in cli.py's _METHODS --

GENDER_PROFILE_SIMILARITY = TfidfCosineSimilarity(
    name="gender-profile-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over grammatical-gender tag "
        "frequency profiles (word-level and pronominal-suffix gender). Not "
        "shipped: masculine dominates ~70% of gender-marked words in "
        "nearly every psalm, so this profile is structurally near-uniform "
        "across the corpus."
    ),
)

NOMINAL_STATE_SIMILARITY = TfidfCosineSimilarity(
    name="nominal-state-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over nominal-state (construct "
        "vs. absolute) tag frequency profiles. Not shipped: absolute state "
        "dominates ~82% of stated words in nearly every psalm, so this "
        "profile is the most degenerate of all methods tried (>=99% of "
        "pairs score above 0.8)."
    ),
)

PHRASE_DEPENDENT_POS_SIMILARITY = TfidfCosineSimilarity(
    name="phrase-dependent-pos-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over phrase-dependent "
        "part-of-speech tag frequency profiles. Not shipped: whole-psalm "
        "POS proportions are nearly constant across the Psalter (every "
        "psalm uses a broadly similar noun/verb/prep/conj mix), though a "
        "windowed, within-psalm version of this signal showed a real "
        "local shift at Psalm 13's lament-to-praise turn - worth revisiting "
        "as a segmentation signal rather than a corpus-wide one."
    ),
)
