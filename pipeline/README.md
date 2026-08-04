# tehillim-pipeline

Computes similarity between the 150 Psalms from ETCBC/BHSA data via
[Text-Fabric](https://annotation.github.io/text-fabric/), and exports the
result as the JSON payload consumed by the `app/` frontend.

Implements nine comparison methods so far, all built on the same generic
`TfidfCosineSimilarity` metric (similarity.py) applied to different
vocabularies (features.py), extracted from BHSA's word-level annotations
(corpus.py):

- **Lexical similarity** — TF-IDF weighted cosine similarity over shared
  Biblical Hebrew content-word lexemes (nouns, verbs, adjectives, adverbs,
  proper nouns, interjections; closed-class grammatical words are excluded).
- **Root similarity** (root_similarity.py) — the same idea, one level
  coarser: keyed on BHSA's triliteral consonantal root instead of lexeme, so
  a verb and its cognate noun (e.g. "to meditate" / "meditation") count as
  shared vocabulary even though they're distinct lexemes. Experimental,
  sparsely-annotated BHSA feature (~20% of Psalter word occurrences).
- **Verb-morphology similarity** (verb_morphology.py) — TF-IDF weighted
  cosine similarity over verb stem (binyan) and mood/conjugation tag
  frequency profiles. This is a form-critical *genre* fingerprint (Gunkel),
  not a lexical-overlap measure: two psalms can score highly here purely by
  sharing a formal register (e.g. both being imperative-heavy hymns)
  regardless of shared vocabulary. See that module's docstring, and
  `tests/test_verb_morphology_integration.py`'s docstring, for what this
  method does and does not empirically recover.
- **Grammatical-person similarity** (person_profile.py) — TF-IDF weighted
  cosine similarity over word-level and pronominal-suffix person/number tag
  profiles ("I" vs. "we" vs. "you" vs. "he/she/it"). A second, independent
  form-critical fingerprint, distinguishing individual from communal
  address. Separates even more cleanly than verb morphology: individual
  laments score 0.87 with each other on average, communal laments 0.73,
  and the two groups only 0.41 with *each other* - below the corpus-wide
  baseline. See `tests/test_person_profile_integration.py`.
- **Grammatical-gender similarity** (gender_profile.py) — the same
  word/suffix split as person, but for masculine/feminine marking.
- **Nominal-state similarity** (nominal_state.py) — construct vs. absolute
  state tag profiles; construct-chain density as a register marker of
  elevated poetic diction.
- **Lexical-set similarity** (lexical_set.py) — BHSA's finer subclassification
  of part-of-speech (numerals, focus particles, words grammaticalized into
  prepositions/adverbs/copulas, ...).
- **Phrase-dependent-part-of-speech similarity** (phrase_dependent_pos.py) —
  a word's syntactic function in its specific phrase, which differs from its
  lexeme's default part-of-speech for about 5.6% of Psalter words (checked
  empirically) - e.g. a substantivized adjective.
- **Named-entity similarity** (named_entity_profile.py) — an onomastic
  profile over named-entity type (person, place, people/nation, deity, ...),
  distinguishing psalms dense with place names from those dense with
  personal or divine names. BHSA flags this feature as incompletely and not
  always correctly assigned.

The architecture is layered (`corpus` → per-feature extractor modules →
`similarity` → `methods` → `export`) so additional comparison methods —
clause/phrase-level morphosyntactic features, distance ensembles, embedding-
or LLM-based, or techniques from discriminant analysis — can be added as new
feature extractors and/or new `SimilarityMethod` implementations without
touching extraction or export. `ground_truth.py` collects known Psalter
landmarks (twin psalms, Elohistic Psalter, Songs of Ascent, Hallel,
refrains, acrostics, Wilson's book frames, and a deliberately hedged set of
Gunkel genre exemplars) that the verb-morphology and person-profile
integration tests validate against - see that module's docstring for
sourcing and caveats. The remaining six methods use lighter, purely
structural integration tests (real corpus, real value distributions, bounded
and non-degenerate scores) rather than that same scholarly-hypothesis depth.

All methods are exported together into one JSON payload (`cli.py`'s
`_METHODS` list), with a frontend dropdown (`app/src/main.ts`) to switch
between them. Adding a new TF-IDF-cosine-style method is a one-line addition
to `_METHODS` plus an entry in `app/src/main.ts`'s `METHOD_LABELS` map.

## Setup

Requires a local clone of [ETCBC/bhsa](https://github.com/ETCBC/bhsa) with
its Text-Fabric data (the `tf/2021` directory). By default the pipeline
looks for it at `~/Developer/hebrew/bhsa/tf/2021`; override with
`--bhsa-path` or the `TEHILLIM_BHSA_PATH` environment variable.

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

Writes `app/public/data/similarity.json`. Pass `--output` to write elsewhere.

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
