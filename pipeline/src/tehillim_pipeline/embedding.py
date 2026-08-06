"""2D embeddings of psalm similarity, for the Cluster page's scatter plot.

Spectral (Laplacian eigenmap) embedding: the same normalized graph
Laplacian eigendecomposition `SpectralClusteringMethod` itself uses
internally (see k_selection.py's `_normalized_laplacian_eigenvalues`),
projected to 2 dimensions via its 2nd- and 3rd-smallest eigenvalues'
eigenvectors (skipping the 1st, trivially-constant eigenvalue/eigenvector
pair every connected graph has).

Replaces the classical (Torgerson) MDS this project shipped earlier.
Classical MDS optimizes a different objective entirely - preserve
variance/distance in the raw similarity matrix - with no guaranteed
relationship to the space spectral clustering actually partitions.
Checked directly against real data, this caused the 2D layout and the
cluster hulls drawn on top of it to visually contradict each other: a
psalm could sit far from its own cluster's other members with nothing
mathematically "wrong," because the picture and the partition were two
independently-derived geometries presented as one. Using the clustering
algorithm's own eigenspace for the plot closes that gap - for any signal
whose data-driven k is 2, this picture *is*, exactly, the space the
algorithm used to make its decision (see
`test_uses_the_same_eigenspace_spectral_clustering_partitions`).

Each axis is scaled by `(1 - eigenvalue)`, not the raw eigenvector: a
normalized-Laplacian eigenvalue near its uninformative ceiling means that
direction carries essentially no cluster-relevant structure (the same
intuition already behind the eigengap k-selection diagnostic), so this
shrinks uninformative axes toward the origin - the same purpose classical
MDS's `eigenvector * sqrt(eigenvalue)` scaling served under its own
(opposite) convention. This is load-bearing, not cosmetic: for a corpus
with no real structure, every non-trivial eigenvalue is tied at the
Laplacian's ceiling, and `eigh` picks an arbitrary orthonormal basis
within that tied eigenspace - unscaled, that arbitrary basis would still
spread points out on screen as if it meant something. Scaling by
`(1 - eigenvalue)` correctly collapses all of them to the origin instead.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from tehillim_pipeline.similarity import SimilarityResult


@dataclass(frozen=True, slots=True)
class Embedding2D:
    method: str
    psalm_numbers: tuple[int, ...]
    x: tuple[float, ...]
    y: tuple[float, ...]
    structure_captured: float
    """Fraction of the corpus's total cluster-relevant spectral structure
    these 2 dimensions capture: sum of `(1 - eigenvalue)^2` for the 2
    eigenvalues used, over that same sum across every non-trivial
    eigenvalue. The direct analogue of classical MDS's "variance
    explained," adapted for the Laplacian's opposite convention (a small
    eigenvalue is the meaningful one, not a large one) - deliberately not
    called "variance explained" itself, since it isn't a decomposition of
    statistical variance the way PCA/classical MDS's own statistic is.
    1.0 for a corpus with no cluster-relevant structure at all (every
    non-trivial eigenvalue sitting at the uninformative ceiling), the
    same "vacuously fully captured" convention classical MDS used."""


def compute_embedding(similarity: SimilarityResult) -> Embedding2D:
    """Spectral embedding of `similarity.matrix`'s own normalized graph
    Laplacian, projected to 2 dimensions."""
    affinity = similarity.matrix
    n = affinity.shape[0]

    degree = affinity.sum(axis=1)
    inv_sqrt_degree = np.diag(1.0 / np.sqrt(degree))
    normalized_affinity = inv_sqrt_degree @ affinity @ inv_sqrt_degree
    laplacian = np.eye(n) - normalized_affinity

    # eigh (not eig) because laplacian is symmetric by construction; it
    # returns eigenvalues ascending, so index 0 is the trivial one.
    eigenvalues, eigenvectors = np.linalg.eigh(laplacian)

    non_trivial = eigenvalues[1:]
    weights = (1.0 - non_trivial) ** 2
    total_weight = float(np.sum(weights))
    captured_weight = float(np.sum(weights[:2]))
    structure_captured = captured_weight / total_weight if total_weight > 0 else 1.0

    scale = 1.0 - eigenvalues[1:3]
    coords = eigenvectors[:, 1:3] * scale

    return Embedding2D(
        method=similarity.method,
        psalm_numbers=similarity.psalm_numbers,
        x=tuple(float(v) for v in coords[:, 0]),
        y=tuple(float(v) for v in coords[:, 1]),
        structure_captured=structure_captured,
    )
