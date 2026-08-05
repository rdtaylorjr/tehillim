"""Shared fixtures for integration tests against the real BHSA corpus.

Integration tests (marked `@pytest.mark.integration`) are automatically
skipped when no local BHSA Text-Fabric dataset is available, so the unit
test suite always runs standalone.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from tehillim_pipeline.clause_kind_profile import build_clause_kind_feature_matrix
from tehillim_pipeline.clause_relation_profile import build_clause_relation_feature_matrix
from tehillim_pipeline.clause_type_profile import build_clause_type_feature_matrix
from tehillim_pipeline.corpus import DEFAULT_BHSA_TF_PATH, DEFAULT_VALENCE_TF_PATH, Corpus
from tehillim_pipeline.features import build_lexical_feature_matrix
from tehillim_pipeline.gender_profile import build_gender_profile_feature_matrix
from tehillim_pipeline.lexical_set import build_lexical_set_feature_matrix
from tehillim_pipeline.methods import (
    CLAUSE_KIND_SIMILARITY,
    CLAUSE_RELATION_SIMILARITY,
    CLAUSE_TYPE_SIMILARITY,
    GENDER_PROFILE_SIMILARITY,
    LEXICAL_SET_SIMILARITY,
    LEXICAL_SIMILARITY,
    NAMED_ENTITY_IDENTITY_SIMILARITY,
    NAMED_ENTITY_SIMILARITY,
    NOMINAL_STATE_SIMILARITY,
    PERSON_PROFILE_SIMILARITY,
    PHRASE_DEPENDENT_POS_SIMILARITY,
    PHRASE_DETERMINATION_SIMILARITY,
    PHRASE_FUNCTION_SIMILARITY,
    PHRASE_GRAMMATICAL_ROLE_SIMILARITY,
    PHRASE_TYPE_SIMILARITY,
    PHRASE_VALENCE_SIMILARITY,
    ROOT_SIMILARITY,
    TEXT_TYPE_SIMILARITY,
    VERB_MORPHOLOGY_SIMILARITY,
    VERB_SENSE_SIMILARITY,
)
from tehillim_pipeline.named_entity_identity import build_named_entity_identity_feature_matrix
from tehillim_pipeline.named_entity_profile import build_named_entity_profile_feature_matrix
from tehillim_pipeline.nominal_state import build_nominal_state_feature_matrix
from tehillim_pipeline.person_profile import build_person_profile_feature_matrix
from tehillim_pipeline.phrase_dependent_pos import build_phrase_dependent_pos_feature_matrix
from tehillim_pipeline.phrase_determination_profile import (
    build_phrase_determination_feature_matrix,
)
from tehillim_pipeline.phrase_function_profile import build_phrase_function_feature_matrix
from tehillim_pipeline.phrase_grammatical_role_profile import (
    build_phrase_grammatical_role_feature_matrix,
)
from tehillim_pipeline.phrase_type_profile import build_phrase_type_feature_matrix
from tehillim_pipeline.phrase_valence_profile import build_phrase_valence_feature_matrix
from tehillim_pipeline.root_similarity import build_root_feature_matrix
from tehillim_pipeline.similarity import tfidf_weights
from tehillim_pipeline.text_type_profile import build_text_type_feature_matrix
from tehillim_pipeline.verb_morphology import build_verb_morphology_feature_matrix
from tehillim_pipeline.verb_sense_profile import build_verb_sense_feature_matrix


def _bhsa_path() -> Path:
    env = os.environ.get("TEHILLIM_BHSA_PATH")
    return Path(env) if env else DEFAULT_BHSA_TF_PATH


def _valence_path() -> Path:
    env = os.environ.get("TEHILLIM_VALENCE_PATH")
    return Path(env) if env else DEFAULT_VALENCE_TF_PATH


BHSA_AVAILABLE = _bhsa_path().exists() and _valence_path().exists()


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    if BHSA_AVAILABLE:
        return
    skip_marker = pytest.mark.skip(
        reason=(
            f"BHSA/valence Text-Fabric data not found at {_bhsa_path()} / {_valence_path()}; "
            "set TEHILLIM_BHSA_PATH / TEHILLIM_VALENCE_PATH"
        )
    )
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip_marker)


@pytest.fixture(scope="session")
def psalms():
    return Corpus.load(_bhsa_path(), _valence_path()).psalms()


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


@pytest.fixture(scope="session")
def clause_type_features(psalms):
    return build_clause_type_feature_matrix(psalms)


@pytest.fixture(scope="session")
def clause_type_result(clause_type_features):
    return CLAUSE_TYPE_SIMILARITY.compute(clause_type_features)


@pytest.fixture(scope="session")
def text_type_features(psalms):
    return build_text_type_feature_matrix(psalms)


@pytest.fixture(scope="session")
def text_type_result(text_type_features):
    return TEXT_TYPE_SIMILARITY.compute(text_type_features)


@pytest.fixture(scope="session")
def clause_relation_features(psalms):
    return build_clause_relation_feature_matrix(psalms)


@pytest.fixture(scope="session")
def clause_relation_result(clause_relation_features):
    return CLAUSE_RELATION_SIMILARITY.compute(clause_relation_features)


@pytest.fixture(scope="session")
def clause_kind_features(psalms):
    return build_clause_kind_feature_matrix(psalms)


@pytest.fixture(scope="session")
def clause_kind_result(clause_kind_features):
    return CLAUSE_KIND_SIMILARITY.compute(clause_kind_features)


@pytest.fixture(scope="session")
def phrase_function_features(psalms):
    return build_phrase_function_feature_matrix(psalms)


@pytest.fixture(scope="session")
def phrase_function_result(phrase_function_features):
    return PHRASE_FUNCTION_SIMILARITY.compute(phrase_function_features)


@pytest.fixture(scope="session")
def phrase_determination_features(psalms):
    return build_phrase_determination_feature_matrix(psalms)


@pytest.fixture(scope="session")
def phrase_determination_result(phrase_determination_features):
    return PHRASE_DETERMINATION_SIMILARITY.compute(phrase_determination_features)


@pytest.fixture(scope="session")
def phrase_type_features(psalms):
    return build_phrase_type_feature_matrix(psalms)


@pytest.fixture(scope="session")
def phrase_type_result(phrase_type_features):
    return PHRASE_TYPE_SIMILARITY.compute(phrase_type_features)


@pytest.fixture(scope="session")
def phrase_valence_features(psalms):
    return build_phrase_valence_feature_matrix(psalms)


@pytest.fixture(scope="session")
def phrase_valence_result(phrase_valence_features):
    return PHRASE_VALENCE_SIMILARITY.compute(phrase_valence_features)


@pytest.fixture(scope="session")
def phrase_grammatical_role_features(psalms):
    return build_phrase_grammatical_role_feature_matrix(psalms)


@pytest.fixture(scope="session")
def phrase_grammatical_role_result(phrase_grammatical_role_features):
    return PHRASE_GRAMMATICAL_ROLE_SIMILARITY.compute(phrase_grammatical_role_features)


@pytest.fixture(scope="session")
def verb_sense_features(psalms):
    return build_verb_sense_feature_matrix(psalms)


@pytest.fixture(scope="session")
def verb_sense_result(verb_sense_features):
    return VERB_SENSE_SIMILARITY.compute(verb_sense_features)
