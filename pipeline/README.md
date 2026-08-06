# tehillim-pipeline

Computes similarity between the 150 Psalms from ETCBC/BHSA data via
[Text-Fabric](https://annotation.github.io/text-fabric/), and exports the
result as the JSON payload consumed by the `app/` frontend.

Implements eleven shipped comparison methods, all built on the same generic
`TfidfCosineSimilarity` metric (similarity.py) applied to different
vocabularies (features.py), extracted from BHSA's word/clause/phrase-level
annotations plus the companion ETCBC/valence module (corpus.py). Grouped
into three families: lexical/vocabulary-based (compare which specific words
appear), syntactic/grammatical-profile (compare how words are used,
independent of vocabulary), and clause/phrase-structure (compare
higher-level syntactic and discourse patterning).

**Lexical family:**

- **Lexical similarity**: TF-IDF weighted cosine similarity over shared
  Biblical Hebrew content-word lexemes (nouns, verbs, adjectives, adverbs,
  proper nouns, interjections; closed-class grammatical words are excluded).
- **Root similarity** (root_similarity.py): the same idea, one level
  coarser: keyed on BHSA's triliteral consonantal root instead of lexeme, so
  a verb and its cognate noun (e.g. "to meditate" / "meditation") count as
  shared vocabulary even though they're distinct lexemes. Experimental,
  sparsely-annotated BHSA feature (~20% of Psalter word occurrences).
- **Named-entity-identity similarity** (named_entity_identity.py): lexical
  similarity restricted to proper nouns, isolating *which specific* names
  (Zion, Jacob, David, ...) two psalms share, rather than just their type.
  The most discriminative of the newer methods (std 0.326, 60% of pairs
  below 0.5), the earlier type-only version diluted this into one dominant
  category.

**Syntactic family:**

- **Verb-morphology similarity** (verb_morphology.py): TF-IDF weighted
  cosine similarity over verb stem (binyan) and conjugation tag frequency
  profiles (`vt`'s domain includes the non-finite `ptca`/`ptcp`
  participles, so "mood" is loose shorthand, not a precise label). This
  operationalizes only the *form* leg of Gunkel's Gattung, not the
  Stimmung or Sitz im Leben he also required, and not a lexical-overlap
  measure: two psalms can score highly here purely by sharing a formal
  register (e.g. both being imperative-heavy hymns)
  regardless of shared vocabulary. See that module's docstring, and
  `tests/test_verb_morphology_integration.py`'s docstring, for what this
  method does and does not empirically recover.
- **Grammatical-person similarity** (person_profile.py): TF-IDF weighted
  cosine similarity over word-level and pronominal-suffix person/number tag
  profiles ("I" vs. "we" vs. "you" vs. "he/she/it"). A second, independent
  form-critical fingerprint, distinguishing individual from communal
  address. Separates even more cleanly than verb morphology: individual
  laments score 0.87 with each other on average, communal laments 0.73,
  and the two groups only 0.41 with *each other*, below the corpus-wide
  baseline. See `tests/test_person_profile_integration.py`.
- **Lexical-set similarity** (lexical_set.py): BHSA's finer subclassification
  of part-of-speech (numerals, focus particles, words grammaticalized into
  prepositions/adverbs/copulas, ...).
- **Named-entity-type similarity** (named_entity_profile.py): an onomastic
  *register* (person, place, people/nation, deity, ...), not which specific
  names appear; see named-entity-identity above for that. The weakest of
  the shipped methods (75% of tagged words fall into one category), kept
  because it still clears a real discriminative bar (20.9% of pairs below
  0.5) and answers a different question than the identity version.

**Clause / phrase structure family:**

- **Clause-type similarity** (clause_type_profile.py): 40 constituent-
  order/verb-form patterns (e.g. wayyiqtol-null vs. nominal clause). The
  single most discriminative method of any tried (66.7% of pairs score
  below 0.5); high cardinality is the likely reason.
- **Text-type similarity** (text_type_profile.py): narrative/discursive/
  quotation, with embedding shown by repetition (e.g. `QND`). BHSA's
  closest analogue to a discourse-register feature; there is no separate
  "discourse" object type in the corpus (checked directly: `sentence`,
  `sentence_atom`, and `half_verse` carry no independent content tags).
- **Clause-relation similarity** (clause_relation_profile.py): coordinated,
  attributive, object-clause, etc. Sparse (22.5% of words) but real signal.
- **Verb-sense similarity** (verb_sense_profile.py): from the ETCBC/valence
  companion module (Janet Dyk, VU/ETCBC, part of the SYNVAR project):
  whether a verb occurrence takes a direct object, a prepositional
  complement, or neither: complementation pattern, distinct from verb
  morphology's stem/mood. Covers 60.6% of Psalter verb occurrences (a
  documented subset of verbs, not all of them).

**Extracted but not shipped:** `gender_profile.py`, `nominal_state.py`,
`phrase_dependent_pos.py`, `clause_kind_profile.py`, `phrase_function_
profile.py`, `phrase_determination_profile.py`, `phrase_type_profile.py`,
`phrase_valence_profile.py`, and `phrase_grammatical_role_profile.py` all
build correct FeatureMatrix data and are fully tested, but a real analysis
run found TF-IDF-cosine over their tag profiles is structurally
near-degenerate (0-4.9% of pairs score below 0.5, vs. 15%+ for every
shipped method). The pattern that emerged across both the word-level and
clause/phrase-level passes: TF-IDF-cosine is only discriminative when a tag
is either high-cardinality or genuinely *sparse* (fires on a minority of
words); dense features, even with good category balance (`phrase_function`
has 27 well-balanced codes and still only clears 2.8%), produce nearly
identical profile shapes across the whole Psalter, and TF-IDF's rarity
weighting can't rescue that since a tag present in ~100% of documents gets
an idf near zero regardless of the metric. Their integration tests document
this finding directly (`test_*_scores_are_highly_compressed`) rather than
asserting a weak bar they'd pass anyway. See `methods.py`'s docstring for
the full rationale and `phrase_dependent_pos`'s note there on a promising
alternative: intra-psalm windowed/sequential analysis (a real, local shift
was found at Psalm 13's lament-to-praise turn) instead of whole-psalm
averaging.

The architecture is layered (`corpus` → per-feature extractor modules →
`similarity` → `methods` → `export`) so additional comparison methods,
clause/phrase-level morphosyntactic features, distance ensembles, embedding-
or LLM-based, or techniques from discriminant analysis, can be added as new
feature extractors and/or new `SimilarityMethod` implementations without
touching extraction or export. `ground_truth.py` collects known Psalter
landmarks (twin psalms, Elohistic Psalter, Songs of Ascent, Hallel,
refrains, acrostics, Wilson's book frames, and a deliberately hedged set of
Gunkel genre exemplars) that the verb-morphology and person-profile
integration tests validate against; see that module's docstring for
sourcing and caveats. The other shipped methods use lighter, purely
structural integration tests (real corpus, real value distributions,
boundedness, and an empirically-grounded discriminativeness bar) rather
than that same scholarly-hypothesis depth.

All shipped methods are exported together into one JSON payload (`cli.py`'s
`_METHODS` list), with a frontend dropdown (`app/src/main.ts`) to switch
between them. Adding a new TF-IDF-cosine-style method is a one-line addition
to `_METHODS` plus an entry in `app/src/main.ts`'s `METHOD_LABELS` map.

## Clustering

`clustering.py` defines a `ClusteringMethod` Protocol mirroring
`similarity.py`'s `SimilarityMethod`, plus `SpectralClusteringMethod`, the
one concrete implementation so far (`sklearn.cluster.SpectralClustering`,
`affinity="precomputed"`: it consumes an already-computed
`SimilarityResult`'s matrix directly rather than building its own features,
so a clustering is guaranteed to partition the same signal the Compare page
shows). `cluster_methods.py` configures one `SpectralClusteringMethod` per
shipped similarity method, all eleven, each choosing its own cluster
count via `data_driven_k` (`k_selection.py`) rather than a shared
fixed number: an earlier version fixed every signal at `n_clusters=6`
(Gunkel's traditional genre count), but that was arbitrary, and checking
it against real data found neither validated genre-fingerprint signal
actually preferred 6 (see the top-level README's "Statistical validation
methodology"). This is a deliberate *per-signal* pass: each method gets
its own independent partition, with no cross-signal fusion yet;
comparing where these partitions agree and disagree is itself useful,
before combining them.

Two different questions get asked side by side. The six syntactic/
clause-structure signals (verb morphology, person, clause type, text type,
clause relation, verb sense) cluster on grammatical form and are validated
against `ground_truth.py`'s `GUNKEL_GENRE_EXEMPLARS` (see
`tests/test_clustering_integration.py`), e.g. individual and communal
laments separate cleanly under person-profile clustering. The five lexical/
vocabulary signals (lexical, root, named-entity-identity, lexical-set,
named-entity-type) cluster on content instead, surfacing *thematic* groups
(psalms that share vocabulary or named entities), not genre; there's no
Gunkel hypothesis to validate them against, so they only get the generic
structural sanity checks (covers all 150 psalms, uses at most 6 labels).

`cli.py`'s `run()` computes every clustering after every similarity result
and writes them to a second payload, `app/public/data/clustering.json`,
consumed by the frontend's Cluster route (`app/src/pages/clusterPage.ts`). Adding a new
clustering method for an already-shipped similarity signal is a one-line
addition to `cluster_methods.py` plus `cli.py`'s `_CLUSTER_METHODS` plus an
entry in `app/src/lib/featureNames.ts`'s shared name registry (used by both
the Compare and Cluster page dropdowns).

## Genre alignment

`gunkel_genre_index.py` is a comprehensive, psalm-by-psalm Gunkel genre
classification (144 of 150 psalms; see the module docstring for the six
excluded composite/partial ones and the resolution rules for cross-listed
or hedged rows), sourced from Tyler F. Williams' compilation of Gunkel's
1933 Einleitung. This supersedes nothing: `ground_truth.py`'s
`GUNKEL_GENRE_EXEMPLARS` stays as the small, low-controversy set the
verb-morphology and person-profile integration tests validate against; the
new index is comprehensive enough to check a whole clustering against, not
just a handful of clearest cases.

`genre_alignment.py`'s `compute_genre_alignment()` cross-tabulates a
`ClusteringResult` against the index: for each Gunkel genre, how many of
its psalms landed in each of the clustering's clusters. `export_clustering.py`
attaches this as `genreAlignment` on every method in `clustering.json`,
rendered by the frontend as a genre x cluster contingency table
(`app/src/components/genreAlignmentMatrix.ts`): a genre concentrated in
one cell means the signal recovers it; a genre spread evenly across a row
means it doesn't.

Cluster indices from `SpectralClusteringMethod` are otherwise arbitrary
integers with no inherent meaning, so `compute_genre_alignment()` also
solves the linear sum assignment problem (the Hungarian algorithm,
`scipy.optimize.linear_sum_assignment`) on the contingency table, giving
each cluster the single genre it overlaps with most, the same technique
used to compute "clustering accuracy" against known labels. This matches
on raw counts, not each genre's row-normalized share, deliberately: shares
were tried and rejected because a genre with only 1-2 indexed psalms can
trivially land 100% inside whatever cluster it happens to fall into, which
is small-sample noise, not a real match (see the function's own docstring
for the checked example). The accepted trade-off in the other direction,
a genre with total overlap in one cluster can lose that cluster's label to
a larger genre with merely a majority share, because more correctly-labeled
psalms wins the sum this assignment maximizes, stays fully visible in the
underlying counts; only the column's one-line caption is affected.

Because that labeling is itself only a display convenience, three
label-independent external validation scores are computed alongside it and
also exported: **purity** (each cluster's largest single-genre share,
unweighted by the matching), **Adjusted Mutual Information** (not plain
NMI, which has no chance correction and biases upward with many small,
uneven categories, exactly this data's shape), and the **Adjusted Rand
Index** (`sklearn.metrics`): both AMI and ARI read ~0 for
independent/random agreement with Gunkel's genres, 1 for an exact match,
and both are additionally permutation-tested and Benjamini-Hochberg
corrected across all eleven signals (see the top-level README's
"Statistical validation methodology" for current per-signal figures rather
than the numbers a single earlier run happened to produce).

## Setup

Requires local clones of [ETCBC/bhsa](https://github.com/ETCBC/bhsa) and
[ETCBC/valence](https://github.com/ETCBC/valence) with their Text-Fabric
data (each repo's `tf/2021` directory; valence uses the same node
numbering as BHSA and is loaded alongside it). By default the pipeline
looks for them at `~/Developer/hebrew/bhsa/tf/2021` and
`~/Developer/hebrew/etcbc/valence/tf/2021`; override with `--bhsa-path` /
`TEHILLIM_BHSA_PATH` and `--valence-path` / `TEHILLIM_VALENCE_PATH`.

```bash
cd pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Usage

```bash
python -m tehillim_pipeline.cli
```

Writes `app/public/data/similarity.json` and `app/public/data/clustering.json`.
Pass `--output` / `--cluster-output` to write elsewhere.

## Development

```bash
pytest              # unit tests (no corpus needed) + integration tests (real corpus)
pytest -m "not integration"   # unit tests only
ruff check src tests
mypy src
```

Integration tests validate the pipeline against known Psalter scholarship
(see `ground_truth.py`): Psalm 14 and 53 are near-identical compositions and
must rank as each other's top match; Psalm 108 is a compilation of Psalm
57:8-12 and 60:7-14 and must show strong similarity to both sources; Psalm
150 (a pure imperative "praise" hymn) must be far closer, under
verb-morphology similarity, to the rest of the Final Hallel (146-150) than
to a stark individual lament. They're automatically skipped if no local
BHSA dataset is found.
