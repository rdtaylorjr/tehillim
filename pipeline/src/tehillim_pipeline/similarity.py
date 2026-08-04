"""Similarity metrics over psalm feature matrices.

Each similarity method takes a FeatureMatrix and produces a symmetric
similarity matrix. The Protocol below defines the shape a method must have;
today only lexical TF-IDF cosine similarity is implemented, but future
representation-learning or discriminant-analysis-based methods can be added
as additional classes without changing any calling code.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import numpy as np
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.metrics.pairwise import cosine_similarity

from tehillim_pipeline.features import FeatureMatrix


def tfidf_weights(features: FeatureMatrix) -> np.ndarray:
    """TF-IDF weight each psalm's lexeme counts.

    Exposed separately from `LexicalTfidfCosine` because the export step
    also needs these weights to explain *why* two psalms are similar (their
    top shared, distinctively-weighted lexemes).
    """
    dense: np.ndarray = TfidfTransformer().fit_transform(features.counts).toarray()
    return dense


@dataclass(frozen=True, slots=True)
class SimilarityResult:
    method: str
    description: str
    psalm_numbers: tuple[int, ...]
    matrix: np.ndarray  # shape (n, n), symmetric, diagonal == 1.0


class SimilarityMethod(Protocol):
    """A named, documented way to turn a FeatureMatrix into psalm similarities."""

    name: str
    description: str

    def compute(self, features: FeatureMatrix) -> SimilarityResult: ...


class LexicalTfidfCosine:
    """Cosine similarity between TF-IDF-weighted content-word vectors.

    Each psalm becomes a vector over the shared lexeme vocabulary, weighted
    so that lexemes common across most psalms (still meaningful words, but
    low in distinguishing power - e.g. "God", "say") count for less than
    lexemes concentrated in a few psalms.
    """

    name = "lexical-tfidf-cosine"
    description = (
        "TF-IDF weighted cosine similarity over shared Biblical Hebrew "
        "content-word lexemes (nouns, verbs, adjectives, adverbs, proper "
        "nouns, interjections)."
    )

    def compute(self, features: FeatureMatrix) -> SimilarityResult:
        weights = tfidf_weights(features)
        matrix = cosine_similarity(weights)
        np.fill_diagonal(matrix, 1.0)
        return SimilarityResult(
            method=self.name,
            description=self.description,
            psalm_numbers=features.psalm_numbers,
            matrix=matrix,
        )
