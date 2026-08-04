# tehillim-pipeline

Computes similarity between the 150 Psalms from ETCBC/BHSA data via
[Text-Fabric](https://annotation.github.io/text-fabric/), and exports the
result as the JSON payload consumed by the `app/` frontend.

Implements two comparison methods so far, both built on the same generic
`TfidfCosineSimilarity` metric (similarity.py) applied to different
vocabularies (features.py):

- **Lexical similarity** — TF-IDF weighted cosine similarity over shared
  Biblical Hebrew content-word lexemes (nouns, verbs, adjectives, adverbs,
  proper nouns, interjections; closed-class grammatical words are excluded).
- **Verb-morphology similarity** (verb_morphology.py) — TF-IDF weighted
  cosine similarity over verb stem (binyan) and mood/conjugation tag
  frequency profiles. This is a form-critical *genre* fingerprint (Gunkel),
  not a lexical-overlap measure: two psalms can score highly here purely by
  sharing a formal register (e.g. both being imperative-heavy hymns)
  regardless of shared vocabulary. See that module's docstring, and
  `tests/test_verb_morphology_integration.py`'s docstring, for what this
  method does and does not empirically recover.

The architecture is layered (`corpus` → `features`/`verb_morphology` →
`similarity` → `methods` → `export`) so additional comparison methods —
further morphosyntactic features, distance ensembles, embedding- or
LLM-based, or techniques from discriminant analysis — can be added as new
feature extractors and/or new `SimilarityMethod` implementations without
touching extraction or export. `ground_truth.py` collects known Psalter
landmarks (twin psalms, Elohistic Psalter, Songs of Ascent, Hallel,
refrains, acrostics, Wilson's book frames, and a deliberately hedged set of
Gunkel genre exemplars) that every method's integration tests validate
against - see that module's docstring for sourcing and caveats.

Both methods are exported together into one JSON payload (`cli.py`'s
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
