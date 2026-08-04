# tehillim-pipeline

Computes similarity between the 150 Psalms from ETCBC/BHSA data via
[Text-Fabric](https://annotation.github.io/text-fabric/), and exports the
result as the JSON payload consumed by the `app/` frontend.

Currently implements one comparison method — **lexical similarity**: TF-IDF
weighted cosine similarity over shared Biblical Hebrew content-word lexemes
(nouns, verbs, adjectives, adverbs, proper nouns, interjections; closed-class
grammatical words like prepositions and conjunctions are excluded). The
architecture is deliberately layered (`corpus` → `features` → `similarity` →
`export`) so additional comparison methods — morphological, syntactic,
embedding- or LLM-based, or techniques from discriminant analysis — can be
added as new `SimilarityMethod` implementations without touching extraction
or export.

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

Integration tests validate the pipeline against known Psalter scholarship:
Psalm 14 and 53 are near-identical compositions and must rank as each
other's top match; Psalm 108 is a compilation of Psalm 57:8-12 and
60:7-14 and must show strong similarity to both sources. They're
automatically skipped if no local BHSA dataset is found.
