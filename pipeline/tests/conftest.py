"""Shared fixtures for integration tests against the real BHSA corpus.

Integration tests (marked `@pytest.mark.integration`) are automatically
skipped when no local BHSA Text-Fabric dataset is available, so the unit
test suite always runs standalone.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from tehillim_pipeline.corpus import DEFAULT_BHSA_TF_PATH, Corpus
from tehillim_pipeline.features import build_lexical_feature_matrix
from tehillim_pipeline.methods import LEXICAL_SIMILARITY, VERB_MORPHOLOGY_SIMILARITY
from tehillim_pipeline.similarity import tfidf_weights
from tehillim_pipeline.verb_morphology import build_verb_morphology_feature_matrix


def _bhsa_path() -> Path:
    env = os.environ.get("TEHILLIM_BHSA_PATH")
    return Path(env) if env else DEFAULT_BHSA_TF_PATH


BHSA_AVAILABLE = _bhsa_path().exists()


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    if BHSA_AVAILABLE:
        return
    skip_marker = pytest.mark.skip(
        reason=f"BHSA Text-Fabric data not found at {_bhsa_path()}; set TEHILLIM_BHSA_PATH"
    )
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_marker)


@pytest.fixture(scope="session")
def psalms():
    return Corpus.load(_bhsa_path()).psalms()


@pytest.fixture(scope="session")
def features(psalms):
    return build_lexical_feature_matrix(psalms)


@pytest.fixture(scope="session")
def weights(features):
    return tfidf_weights(features)


@pytest.fixture(scope="session")
def similarity_result(features):
    return LEXICAL_SIMILARITY.compute(features)


@pytest.fixture(scope="session")
def verb_morphology_features(psalms):
    return build_verb_morphology_feature_matrix(psalms)


@pytest.fixture(scope="session")
def verb_morphology_result(verb_morphology_features):
    return VERB_MORPHOLOGY_SIMILARITY.compute(verb_morphology_features)
