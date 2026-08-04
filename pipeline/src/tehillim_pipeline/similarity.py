"""Similarity metrics over psalm feature matrices.

Each similarity method takes a FeatureMatrix and produces a symmetric
similarity matrix. The `SimilarityMethod` Protocol defines the shape a
method must have. `TfidfCosineSimilarity` implements the one metric used so
far - TF-IDF weight each psalm's term-count vector, then cosine-compare -
which underlies every "shared vocabulary" style method regardless of what
vocabulary populates the FeatureMatrix (lexemes, verb-morphology tags, ...).
Each concrete method is this class configured with a name/description and
paired with a feature extractor (see features.py, verb_morphology.py).
Future non-vocabulary-based methods (embeddings, alignment kernels, ...)
implement the same Protocol without necessarily using this class.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import numpy as np
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.metrics.pairwise import cosine_similarity

from tehillim_pipeline.features import FeatureMatrix


def tfidf_weights(features: FeatureMatrix) -> np.ndarray:
    """TF-IDF weight each psalm's term counts.

    Exposed separately from `TfidfCosineSimilarity` because the export step
    also needs these weights to explain *why* two psalms are similar (their
    top shared, distinctively-weighted terms).
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


class TfidfCosineSimilarity:
    """Cosine similarity between TF-IDF-weighted term vectors.

    Each psalm becomes a vector over the shared term vocabulary, weighted so
    that terms common across most psalms (low distinguishing power) count
    for less than terms concentrated in a few psalms. What the terms *are*
    is entirely up to the FeatureMatrix passed in.
    """

    def __init__(self, name: str, description: str) -> None:
        self.name = name
        self.description = description

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
