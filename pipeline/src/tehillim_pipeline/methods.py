"""Configured similarity methods: a metric (similarity.py) paired with the
name/description of the vocabulary it's being applied to.

This is the composition layer, and deliberately the only module that
imports both a metric and a feature extractor. features.py and
verb_morphology.py know nothing about similarity metrics; similarity.py
knows nothing about specific vocabularies. Callers (cli.py, tests) get one
place to obtain a ready-to-use, fully configured method.
"""

from __future__ import annotations

from tehillim_pipeline.similarity import TfidfCosineSimilarity

LEXICAL_SIMILARITY = TfidfCosineSimilarity(
    name="lexical-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over shared Biblical Hebrew "
        "content-word lexemes (nouns, verbs, adjectives, adverbs, proper "
        "nouns, interjections)."
    ),
)

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

GENDER_PROFILE_SIMILARITY = TfidfCosineSimilarity(
    name="gender-profile-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over grammatical-gender tag "
        "frequency profiles (word-level and pronominal-suffix gender) - "
        "masculine vs. feminine address/reference, independent of person "
        "and verb morphology."
    ),
)

NOMINAL_STATE_SIMILARITY = TfidfCosineSimilarity(
    name="nominal-state-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over nominal-state (construct "
        "vs. absolute) tag frequency profiles - construct-chain density as "
        "a register marker of elevated poetic diction."
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

PHRASE_DEPENDENT_POS_SIMILARITY = TfidfCosineSimilarity(
    name="phrase-dependent-pos-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over phrase-dependent "
        "part-of-speech tag frequency profiles - a word's syntactic "
        "function in its specific phrase, which differs from its lexeme's "
        "default part-of-speech for about 5.6% of Psalter words."
    ),
)

NAMED_ENTITY_SIMILARITY = TfidfCosineSimilarity(
    name="named-entity-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over named-entity-type tag "
        "frequency profiles (person, place, people/nation, deity, ...) - "
        "an onomastic profile distinguishing psalms dense with place names "
        "from those dense with personal or divine names."
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
