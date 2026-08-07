"""Semantic similarity from pretrained/fine-tuned Biblical Hebrew sentence
embeddings, over BHSA half-verses - the one signal in this project that
represents *meaning* rather than grammatical form or shared vocabulary.

Every similarity method elsewhere in this package (`methods.py`) is a
morphosyntactic tag-frequency profile or lexical-overlap measure. None of
them can access Stimmung, the mood/attitude leg of Gunkel's Gattung
definition (see the README's "Genre track" section) - that requires
representing what a psalm *means*, not how its words are tagged or which
exact lexemes it uses. This module is the first attempt at that.

It uses MiqraBERT (David M. Smiley, arXiv:2606.19638, huggingface.co/
davidmsmiley/MiqraBERT), a Sentence-BERT model fine-tuned from AlephBERT for
Biblical Hebrew verse-level semantic similarity, and AlephBERT itself
(imvladikon/sentence-transformers-alephbert) as an unfinetuned baseline -
MiqraBERT was fine-tuned specifically as a *parallel-passage/quotation*
detector (positive pairs = textual parallels, negatives = random unrelated
verses), which is a different target than "shares a genre register", so
whether that fine-tuning helps or hurts for this project's purpose is an
open, testable question, not an assumption.

Granularity is half-verses, not whole verses or whole psalms, via BHSA's
own `half_verse` sectional otype - matching the unit MiqraBERT's own
training pairs used. Smiley's paper reports MiqraBERT's recall@10 on
poetic parallelism falls below 9% (vs. 87.1% on narrative), attributed
directly to mean-pooling an entire verse into one vector, which erases the
token-level signal poetic parallelism depends on. `mean_pool_similarity`
still collapses each psalm to one vector (just from finer-grained
half-verse input) and is kept as the naive baseline. `soft_alignment_
similarity` is this module's actual proposal: treat each psalm as a *set*
of half-verse vectors and compare sets directly (symmetric best-match
average, a Chamfer-style soft alignment), so two psalms can score highly
similar on the strength of one genuinely matching half-verse even if nothing
else in either psalm corresponds - precisely the case a single pooled
vector per psalm cannot represent. Both are computed and compared honestly
(see the README), not assumed in advance to be the better design.

Real results (see the README's "Statistical validation methodology"):
unfinetuned AlephBERT, not MiqraBERT, is the strongest genre-family AMI
signal in the whole project for both aggregations, while MiqraBERT
collapses to a single cluster (k=1, no structure found) for both - the
most plausible reading is that fine-tuning for parallel-passage detection
specifically (pushing the overwhelming majority of non-parallel pairs
toward one indistinct region) destroyed the general-semantic variation
genre discrimination depends on. All four are shipped to the Cluster page
regardless of outcome, including MiqraBERT's negative result, the same
"don't hide a negative finding" precedent text-type's own k=1 already set
(see `cluster_methods.py`).
"""

from __future__ import annotations

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from tehillim_pipeline.clustering import SpectralClusteringMethod, data_driven_k
from tehillim_pipeline.corpus import Psalm
from tehillim_pipeline.similarity import SimilarityResult

#: Search range for the data-driven k-selector below - matches
#: cluster_methods.py's own _K_VALUES exactly, so the eleven TF-IDF-based
#: signals and these four embedding-based ones are searched over the same
#: range and their k-choices are directly comparable.
_K_VALUES = range(2, 11)

#: Fine-tuned for Biblical Hebrew parallel-passage detection (Smiley,
#: arXiv:2606.19638). Publicly released, verified directly against its
#: Hugging Face model card: 768-dim, mean-pooled AlephBERT encoder,
#: expects vocalized Hebrew (niqqud), not consonantal-only text.
MIQRABERT_MODEL = "davidmsmiley/MiqraBERT"

#: The unfinetuned base encoder MiqraBERT was built from - the ablation
#: baseline that tells us whether fine-tuning for parallel detection helped
#: or hurt for genre-similarity, a different target than what it was
#: trained for.
ALEPHBERT_MODEL = "imvladikon/sentence-transformers-alephbert"


def compute_half_verse_embeddings(psalms: list[Psalm], model_name: str) -> dict[int, np.ndarray]:
    """Encode every psalm's half-verses with `model_name`.

    Returns one L2-normalized embedding matrix per psalm number, shape
    (n_half_verses, embedding_dim). Imports `sentence_transformers` lazily
    so the rest of this module (and its unit tests) doesn't require torch
    to be importable.
    """
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(model_name)
    embeddings: dict[int, np.ndarray] = {}
    for psalm in psalms:
        vectors = model.encode(list(psalm.half_verses), normalize_embeddings=True)
        embeddings[psalm.number] = np.asarray(vectors)
    return embeddings


def mean_pool_vectors(embeddings: dict[int, np.ndarray]) -> tuple[np.ndarray, tuple[int, ...]]:
    """Collapse each psalm's half-verse embeddings to their mean - the raw
    per-psalm coordinate vectors this module's own `mean_pool_similarity`
    is built from, exposed separately since `rf_proximity.py` and
    `gmm_clustering.py` need the actual coordinate matrix (a real per-psalm
    point in embedding space), not a derived cosine-similarity matrix."""
    psalm_numbers = tuple(embeddings.keys())
    pooled = np.array([embeddings[p].mean(axis=0) for p in psalm_numbers])
    return pooled, psalm_numbers


def mean_pool_similarity(
    embeddings: dict[int, np.ndarray],
    *,
    name: str = "semantic-mean-pool-cosine",
    description: str = "Cosine similarity between mean-pooled half-verse embeddings.",
) -> SimilarityResult:
    """Cosine-compare each psalm's mean-pooled half-verse embeddings - the
    naive extension of MiqraBERT's own whole-verse mean-pooling to finer
    input granularity. Kept as the baseline `soft_alignment_similarity` is
    measured against."""
    pooled, psalm_numbers = mean_pool_vectors(embeddings)
    matrix = cosine_similarity(pooled)
    np.fill_diagonal(matrix, 1.0)
    return SimilarityResult(
        method=name, description=description, psalm_numbers=psalm_numbers, matrix=matrix
    )


def soft_alignment_similarity(
    embeddings: dict[int, np.ndarray],
    *,
    name: str = "semantic-soft-alignment-cosine",
    description: str = (
        "Symmetric best-match cosine similarity between two psalms' half-verse "
        "embedding sets, avoiding the single-pooled-vector bottleneck."
    ),
) -> SimilarityResult:
    """Treat each psalm as a *set* of half-verse vectors rather than
    collapsing it to one. similarity(A, B) is the symmetric average of
    best-match cosine similarity: for each half-verse in A, its most
    similar half-verse in B, averaged, and the same in the other direction,
    then the two directions averaged. A Chamfer-style soft alignment - see
    this module's docstring for why this is the design meant to actually
    test MiqraBERT's own diagnosed pooling-granularity weakness, not just
    relocate it."""
    psalm_numbers = tuple(embeddings.keys())
    n = len(psalm_numbers)
    matrix = np.empty((n, n))
    for i, psalm_i in enumerate(psalm_numbers):
        matrix[i, i] = 1.0
        for j in range(i + 1, n):
            psalm_j = psalm_numbers[j]
            score = _soft_alignment_score(embeddings[psalm_i], embeddings[psalm_j])
            matrix[i, j] = score
            matrix[j, i] = score
    return SimilarityResult(
        method=name, description=description, psalm_numbers=psalm_numbers, matrix=matrix
    )


def _soft_alignment_score(a: np.ndarray, b: np.ndarray) -> float:
    pairwise = cosine_similarity(a, b)  # shape (len(a), len(b))
    a_to_b = pairwise.max(axis=1).mean()
    b_to_a = pairwise.max(axis=0).mean()
    return float((a_to_b + b_to_a) / 2)


class MeanPoolEmbeddingSimilarity:
    """A named, documented `mean_pool_similarity` configuration - mirrors
    `similarity.TfidfCosineSimilarity`'s shape, but over an embeddings dict
    rather than a `FeatureMatrix` (see `similarity.py`'s module docstring:
    "Future non-vocabulary-based methods... implement the same Protocol
    without necessarily using this class")."""

    def __init__(self, name: str, description: str) -> None:
        self.name = name
        self.description = description

    def compute(self, embeddings: dict[int, np.ndarray]) -> SimilarityResult:
        return mean_pool_similarity(embeddings, name=self.name, description=self.description)


class SoftAlignmentEmbeddingSimilarity:
    """A named, documented `soft_alignment_similarity` configuration - see
    `MeanPoolEmbeddingSimilarity`."""

    def __init__(self, name: str, description: str) -> None:
        self.name = name
        self.description = description

    def compute(self, embeddings: dict[int, np.ndarray]) -> SimilarityResult:
        return soft_alignment_similarity(embeddings, name=self.name, description=self.description)


# --- Configured method instances: the 2x2 encoder x aggregation ablation --
#
# Not wired into methods.py/cli.py/the frontend - this phase is a pipeline-
# side analysis only (see the README's semantic-signal results section),
# not a shipped similarity method, pending a real result worth surfacing.

MIQRABERT_MEAN_POOL_SIMILARITY = MeanPoolEmbeddingSimilarity(
    name="miqrabert-mean-pool-cosine",
    description=(
        "Cosine similarity between MiqraBERT half-verse embeddings, mean-pooled "
        "per psalm. The naive extension of MiqraBERT's own whole-verse pooling "
        "to half-verse input; kept as a baseline, not assumed to be sufficient."
    ),
)

MIQRABERT_SOFT_ALIGNMENT_SIMILARITY = SoftAlignmentEmbeddingSimilarity(
    name="miqrabert-soft-alignment-cosine",
    description=(
        "Symmetric best-match cosine similarity between two psalms' MiqraBERT "
        "half-verse embedding sets - avoids collapsing each psalm to one pooled "
        "vector, directly targeting MiqraBERT's own diagnosed poetic-pooling "
        "weakness rather than just moving it to a finer input granularity."
    ),
)

ALEPHBERT_MEAN_POOL_SIMILARITY = MeanPoolEmbeddingSimilarity(
    name="alephbert-mean-pool-cosine",
    description=(
        "Cosine similarity between unfinetuned AlephBERT half-verse embeddings, "
        "mean-pooled per psalm. Ablation baseline: MiqraBERT was fine-tuned to "
        "detect textual parallels, not genre register, so this checks whether "
        "that fine-tuning helped or hurt for this project's actual question."
    ),
)

ALEPHBERT_SOFT_ALIGNMENT_SIMILARITY = SoftAlignmentEmbeddingSimilarity(
    name="alephbert-soft-alignment-cosine",
    description=(
        "Symmetric best-match cosine similarity between two psalms' unfinetuned "
        "AlephBERT half-verse embedding sets. Same ablation logic as "
        "alephbert-mean-pool-cosine, paired with the soft-alignment aggregation."
    ),
)


# --- Clustering: mirrors cluster_methods.py's SIMILARITY -> CLUSTERING ----
# wrapping pattern, kept here rather than in cluster_methods.py since that
# module is specifically the composition layer for methods.py's TF-IDF-
# based signals - this module is already the self-contained equivalent for
# embedding-based ones (see similarity.py's own docstring: "Future
# non-vocabulary-based methods... implement the same Protocol without
# necessarily using this class").

MIQRABERT_MEAN_POOL_CLUSTERING = SpectralClusteringMethod(
    name="miqrabert-mean-pool-spectral",
    description=MIQRABERT_MEAN_POOL_SIMILARITY.description,
    k_selector=data_driven_k(_K_VALUES),
)

MIQRABERT_SOFT_ALIGNMENT_CLUSTERING = SpectralClusteringMethod(
    name="miqrabert-soft-alignment-spectral",
    description=MIQRABERT_SOFT_ALIGNMENT_SIMILARITY.description,
    k_selector=data_driven_k(_K_VALUES),
)

ALEPHBERT_MEAN_POOL_CLUSTERING = SpectralClusteringMethod(
    name="alephbert-mean-pool-spectral",
    description=ALEPHBERT_MEAN_POOL_SIMILARITY.description,
    k_selector=data_driven_k(_K_VALUES),
)

ALEPHBERT_SOFT_ALIGNMENT_CLUSTERING = SpectralClusteringMethod(
    name="alephbert-soft-alignment-spectral",
    description=ALEPHBERT_SOFT_ALIGNMENT_SIMILARITY.description,
    k_selector=data_driven_k(_K_VALUES),
)
