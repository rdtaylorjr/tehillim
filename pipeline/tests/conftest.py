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
from tehillim_pipeline.gender_profile import build_gender_profile_feature_matrix
from tehillim_pipeline.lexical_set import build_lexical_set_feature_matrix
from tehillim_pipeline.methods import (
    GENDER_PROFILE_SIMILARITY,
    LEXICAL_SET_SIMILARITY,
    LEXICAL_SIMILARITY,
    NAMED_ENTITY_IDENTITY_SIMILARITY,
    NAMED_ENTITY_SIMILARITY,
    NOMINAL_STATE_SIMILARITY,
    PERSON_PROFILE_SIMILARITY,
    PHRASE_DEPENDENT_POS_SIMILARITY,
    ROOT_SIMILARITY,
    VERB_MORPHOLOGY_SIMILARITY,
)
from tehillim_pipeline.named_entity_identity import build_named_entity_identity_feature_matrix
from tehillim_pipeline.named_entity_profile import build_named_entity_profile_feature_matrix
from tehillim_pipeline.nominal_state import build_nominal_state_feature_matrix
from tehillim_pipeline.person_profile import build_person_profile_feature_matrix
from tehillim_pipeline.phrase_dependent_pos import build_phrase_dependent_pos_feature_matrix
from tehillim_pipeline.root_similarity import build_root_feature_matrix
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


@pytest.fixture(scope="session")
def person_profile_features(psalms):
    return build_person_profile_feature_matrix(psalms)


@pytest.fixture(scope="session")
def person_profile_result(person_profile_features):
    return PERSON_PROFILE_SIMILARITY.compute(person_profile_features)


@pytest.fixture(scope="session")
def gender_profile_features(psalms):
    return build_gender_profile_feature_matrix(psalms)


@pytest.fixture(scope="session")
def gender_profile_result(gender_profile_features):
    return GENDER_PROFILE_SIMILARITY.compute(gender_profile_features)


@pytest.fixture(scope="session")
def nominal_state_features(psalms):
    return build_nominal_state_feature_matrix(psalms)


@pytest.fixture(scope="session")
def nominal_state_result(nominal_state_features):
    return NOMINAL_STATE_SIMILARITY.compute(nominal_state_features)


@pytest.fixture(scope="session")
def lexical_set_features(psalms):
    return build_lexical_set_feature_matrix(psalms)


@pytest.fixture(scope="session")
def lexical_set_result(lexical_set_features):
    return LEXICAL_SET_SIMILARITY.compute(lexical_set_features)


@pytest.fixture(scope="session")
def phrase_dependent_pos_features(psalms):
    return build_phrase_dependent_pos_feature_matrix(psalms)


@pytest.fixture(scope="session")
def phrase_dependent_pos_result(phrase_dependent_pos_features):
    return PHRASE_DEPENDENT_POS_SIMILARITY.compute(phrase_dependent_pos_features)


@pytest.fixture(scope="session")
def named_entity_features(psalms):
    return build_named_entity_profile_feature_matrix(psalms)


@pytest.fixture(scope="session")
def named_entity_result(named_entity_features):
    return NAMED_ENTITY_SIMILARITY.compute(named_entity_features)


@pytest.fixture(scope="session")
def root_features(psalms):
    return build_root_feature_matrix(psalms)


@pytest.fixture(scope="session")
def root_result(root_features):
    return ROOT_SIMILARITY.compute(root_features)


@pytest.fixture(scope="session")
def named_entity_identity_features(psalms):
    return build_named_entity_identity_feature_matrix(psalms)


@pytest.fixture(scope="session")
def named_entity_identity_result(named_entity_identity_features):
    return NAMED_ENTITY_IDENTITY_SIMILARITY.compute(named_entity_identity_features)
