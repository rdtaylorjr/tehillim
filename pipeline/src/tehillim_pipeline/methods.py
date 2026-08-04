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
