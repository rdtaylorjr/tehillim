"""Configured similarity methods: a metric (similarity.py) paired with the
name/description of the vocabulary it's being applied to.

This is the composition layer, and deliberately the only module that
imports both a metric and a feature extractor. features.py and
verb_morphology.py know nothing about similarity metrics; similarity.py
knows nothing about specific vocabularies. Callers (cli.py, tests) get one
place to obtain a ready-to-use, fully configured method.

Grouped into three families: lexical/vocabulary-based methods (compare which
specific words appear), syntactic/grammatical-profile methods (compare how
words are used, independent of vocabulary), and clause/phrase-structure
methods (compare higher-level syntactic and discourse patterning). `cli.py`'s
`_METHODS` tuple is what actually determines which methods ship in the app -
not every method configured here is wired in there.

A recurring, load-bearing empirical finding across both the word-level and
clause/phrase-level analysis passes: TF-IDF-cosine over a tag-frequency
profile is only discriminative when the tag is either high-cardinality or
*sparse* (fires on a minority of words). Dense features - present on most
or every word, even with a healthy-looking category count - produce nearly
identical profile shapes across the whole Psalter (every psalm needs verbs,
nouns, determined phrases, core arguments, ...) and TF-IDF's rarity
weighting can't rescue that, since a tag present in ~100% of documents gets
an idf near zero regardless of the metric. This is why `GENDER_PROFILE_
SIMILARITY`, `NOMINAL_STATE_SIMILARITY`, `PHRASE_DEPENDENT_POS_SIMILARITY`,
`CLAUSE_KIND_SIMILARITY`, `PHRASE_FUNCTION_SIMILARITY`, `PHRASE_
DETERMINATION_SIMILARITY`, `PHRASE_TYPE_SIMILARITY`, and `PHRASE_VALENCE_
SIMILARITY`/`PHRASE_GRAMMATICAL_ROLE_SIMILARITY` are all kept here (their
extractors and tests still exist, and stayed correct) but NOT shipped -
each measured near-degenerate (see their integration tests, which document
the finding directly). `CLAUSE_TYPE_SIMILARITY`, `TEXT_TYPE_SIMILARITY`,
`CLAUSE_RELATION_SIMILARITY`, and `VERB_SENSE_SIMILARITY` survived because
each is either high-cardinality (clause_type: 40 codes) or genuinely sparse
(clause_relation: 22.5% coverage; verb_sense: 12.6%, restricted to verbs).
The extraction behind every retired method is correct and may still be
useful analyzed a different way (e.g. intra-psalm sequential change-point
detection instead of whole-psalm averaging) - see the project's
method-evaluation notes.
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

# --- Clause / phrase structure: compare higher-level syntactic patterning -

CLAUSE_TYPE_SIMILARITY = TfidfCosineSimilarity(
    name="clause-type-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over clause-type tag frequency "
        "profiles (40 constituent-order/verb-form patterns, e.g. "
        "wayyiqtol-null vs. nominal clause) - the most discriminative of "
        "the clause/phrase-structure methods (66.7% of pairs score below "
        "0.5), a finer decomposition of clause structure than verb "
        "morphology's stem/mood tags alone."
    ),
)

TEXT_TYPE_SIMILARITY = TfidfCosineSimilarity(
    name="text-type-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over text-type tag frequency "
        "profiles (narrative/discursive/quotation, with embedding) - "
        "BHSA's closest analogue to a discourse-register feature; a "
        "quotation-heavy psalm reads differently from a narrative-heavy one."
    ),
)

CLAUSE_RELATION_SIMILARITY = TfidfCosineSimilarity(
    name="clause-relation-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over clause-relation tag "
        "frequency profiles (coordinated, attributive, object clause, "
        "...) - sparse (22.5% of words) but real signal, the same shape "
        "as lexical-set similarity."
    ),
)

VERB_SENSE_SIMILARITY = TfidfCosineSimilarity(
    name="verb-sense-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over verb argument-realization "
        "codes from the ETCBC/valence module (Janet Dyk, VU/ETCBC) - "
        "whether a verb occurrence takes a direct object, a prepositional "
        "complement, or neither. Distinct from verb morphology: this is "
        "complementation pattern, not stem/mood. Covers 60.6% of Psalter "
        "verb occurrences (a documented subset of verbs, not all of them)."
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

CLAUSE_KIND_SIMILARITY = TfidfCosineSimilarity(
    name="clause-kind-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over clause-kind (verbal/"
        "nominal/without-predication) tag frequency profiles. Not shipped: "
        "only 3 categories, dense (100% of words tagged), 0% of pairs "
        "score below 0.5 - the same degenerate shape as nominal-state."
    ),
)

PHRASE_FUNCTION_SIMILARITY = TfidfCosineSimilarity(
    name="phrase-function-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over phrase-function tag "
        "frequency profiles (predicate, subject, object, ...). Not "
        "shipped: despite good category balance (27 codes, none over "
        "24%), it's dense (100% of words tagged) and only 2.8% of pairs "
        "score below 0.5 - balance alone doesn't rescue a dense feature."
    ),
)

PHRASE_DETERMINATION_SIMILARITY = TfidfCosineSimilarity(
    name="phrase-determination-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over phrase-determination "
        "(determined/undetermined) tag frequency profiles. Not shipped: "
        "only 2 categories, dense, 0% of pairs score below 0.5."
    ),
)

PHRASE_TYPE_SIMILARITY = TfidfCosineSimilarity(
    name="phrase-type-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over phrase-type tag frequency "
        "profiles (verbal/nominal/prepositional phrase, ...). Not shipped: "
        "dense (100% of words tagged), 0% of pairs score below 0.5 - the "
        "same failure mode as phrase-dependent-pos despite 13 categories."
    ),
)

PHRASE_VALENCE_SIMILARITY = TfidfCosineSimilarity(
    name="phrase-valence-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over ETCBC/valence core/"
        "complement/adjunct tag frequency profiles. Not shipped: despite a "
        "real 3-way split with no crushing single-category dominance, it's "
        "dense (69% of words tagged) and only 0.2% of pairs score below "
        "0.5 - density mattered more than category balance."
    ),
)

PHRASE_GRAMMATICAL_ROLE_SIMILARITY = TfidfCosineSimilarity(
    name="phrase-grammatical-role-tfidf-cosine",
    description=(
        "TF-IDF weighted cosine similarity over ETCBC/valence fine-grained "
        "constituent-role tag frequency profiles (direct/indirect object, "
        "subject, ...). Not shipped: 4.9% of pairs score below 0.5, the "
        "same density-driven compression as phrase-function."
    ),
)
