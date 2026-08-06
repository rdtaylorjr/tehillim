"""Configured clustering methods: one per shipped similarity signal, each
choosing its own number of clusters from its own data.

Mirrors `methods.py`'s composition-layer role, but for clustering instead
of pairwise similarity: this is the only module that imports both
`clustering.py`'s metric and a similarity method's identity, so extractors
and metrics stay ignorant of each other. This is a *per-signal* clustering
pass - every shipped similarity method gets its own independent partition
of the corpus, with no fusion across signals yet. Comparing where these
partitions agree and disagree is itself the point of running them
separately first.

Two different kinds of question live side by side here, and the
description text says explicitly which one each method answers:

- The lexical family (lexical, root, named-entity-identity, lexical-set,
  named-entity-type) clusters on vocabulary/content - which words, roots,
  or names two psalms share. These surface *thematic* groups (e.g. psalms
  that name Zion, psalms dense with covenant vocabulary), not genre.
- The syntactic/clause-structure family (verb-morphology, person-profile,
  clause-type, text-type, clause-relation, verb-sense) clusters on
  grammatical form, independent of vocabulary - the actual target of
  Gunkel's form-critical genre categories, and the only family validated
  against `ground_truth.py`'s GUNKEL_GENRE_EXEMPLARS (see
  test_clustering_integration.py).

Every method here used to share one fixed `n_clusters=6` - chosen
arbitrarily, by matching Gunkel's traditional count of form-critical genre
categories (hymn, individual lament, communal lament, thanksgiving, royal,
wisdom), not derived from anything about this data. That was never checked
until `k_selection.py` was built: its silhouette score and spectral
eigengap, run against the real verb-morphology and person-profile
similarity matrices, both prefer a *coarser* partition than 6 for either
signal (verb-morphology peaks sharply at k=2; person-profile peaks at
k=4, with k=2 close behind). Once that was known, keeping a number that
was arbitrary to begin with stopped being defensible - every method below
now uses `data_driven_k`, choosing its own k from its own similarity
matrix each time (see clustering.py), rather than a value borrowed from a
different signal's genre count. See the top-level README's "Statistical
validation methodology" section for the actual per-signal numbers.
"""

from __future__ import annotations

from tehillim_pipeline.clustering import SpectralClusteringMethod, data_driven_k

#: Search range for the data-driven k-selector below. 2-10 comfortably
#: brackets everything actually observed across the shipped signals so far
#: (silhouette-best values of 2 and 4) without searching implausibly fine
#: partitions of a 150-psalm corpus.
_K_VALUES = range(2, 11)

# --- Lexical / vocabulary-based: thematic clusters, not genre --------------

LEXICAL_CLUSTERING = SpectralClusteringMethod(
    name="lexical-spectral",
    description=(
        "Spectral clustering over lexical similarity. Partitions the "
        "Psalter by shared Biblical Hebrew content-word vocabulary (nouns, "
        "verbs, adjectives, adverbs, proper nouns, interjections). A "
        "thematic grouping (which words two psalms share), not a genre "
        "grouping. Contrast with the syntactic/clause-structure methods "
        "below, which cluster on grammatical form instead."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

ROOT_CLUSTERING = SpectralClusteringMethod(
    name="root-spectral",
    description=(
        "Spectral clustering over root similarity. Partitions the Psalter "
        "by shared triliteral consonantal roots, a coarser cousin of "
        "lexical clustering that credits shared thematic vocabulary across "
        "derivationally related words (e.g. a verb and its cognate noun) "
        "that lexical similarity keeps distinct. Thematic, not genre."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

NAMED_ENTITY_IDENTITY_CLUSTERING = SpectralClusteringMethod(
    name="named-entity-identity-spectral",
    description=(
        "Spectral clustering over named-entity-identity similarity. "
        "Partitions the Psalter by which specific proper nouns (personal "
        "names, place names, ...) two psalms share, e.g. a Zion-naming "
        "cluster distinct from a Sinai-naming one. Thematic, not genre."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

LEXICAL_SET_CLUSTERING = SpectralClusteringMethod(
    name="lexical-set-spectral",
    description=(
        "Spectral clustering over lexical-set similarity. Partitions the "
        "Psalter by numeral, focus-particle, and grammaticalized-"
        "preposition/adverb/copula tag frequency profile, a finer "
        "part-of-speech subclassification than `sp`. Sits between the "
        "lexical and syntactic families: closer to vocabulary than to "
        "clause structure, so read its clusters as thematic leanings, not "
        "genre."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

NAMED_ENTITY_CLUSTERING = SpectralClusteringMethod(
    name="named-entity-spectral",
    description=(
        "Spectral clustering over named-entity-type similarity. "
        "Partitions the Psalter by onomastic register (person-name-dense "
        "vs. place-name-dense vs. deity-name-dense, ...), independent of "
        "which specific names appear. Thematic, not genre."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

# --- Syntactic / grammatical-profile: candidate form-critical signals -----

VERB_MORPHOLOGY_CLUSTERING = SpectralClusteringMethod(
    name="verb-morphology-spectral",
    description=(
        "Spectral clustering over verb-morphology similarity. Partitions "
        "the Psalter by verb stem/conjugation tag profile (including "
        "participles), motivated by Gunkel's form-critical genre "
        "categories but validated only narrowly against them; see the "
        "README."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

PERSON_PROFILE_CLUSTERING = SpectralClusteringMethod(
    name="person-profile-spectral",
    description=(
        "Spectral clustering over grammatical-person similarity. "
        "Partitions the Psalter by individual vs. communal address, a "
        "classical form-critical marker distinct from verb morphology."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

CLAUSE_TYPE_CLUSTERING = SpectralClusteringMethod(
    name="clause-type-spectral",
    description=(
        "Spectral clustering over clause-type similarity. Partitions the "
        "Psalter by constituent-order/verb-form clause pattern, the most "
        "discriminative signal of any tried (66.7% of pairs score below "
        "0.5)."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

TEXT_TYPE_CLUSTERING = SpectralClusteringMethod(
    name="text-type-spectral",
    description=(
        "Spectral clustering over text-type similarity. Partitions the "
        "Psalter by narrative/discursive/quotation discourse register, "
        "BHSA's closest analogue to a discourse-register feature."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

CLAUSE_RELATION_CLUSTERING = SpectralClusteringMethod(
    name="clause-relation-spectral",
    description=(
        "Spectral clustering over clause-relation similarity. Partitions "
        "the Psalter by how clauses relate to their context (coordinated, "
        "attributive, object clause, ...); sparse (22.5% of words) but "
        "real signal."
    ),
    k_selector=data_driven_k(_K_VALUES),
)

VERB_SENSE_CLUSTERING = SpectralClusteringMethod(
    name="verb-sense-spectral",
    description=(
        "Spectral clustering over verb-sense similarity. Partitions the "
        "Psalter by verb argument-realization pattern (ETCBC/valence), "
        "covering 60.6% of Psalter verb occurrences."
    ),
    k_selector=data_driven_k(_K_VALUES),
)
