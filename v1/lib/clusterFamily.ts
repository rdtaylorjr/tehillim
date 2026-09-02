import { baseFeatureId } from "./featureNames";

//: Mirrors pipeline/cluster_methods.py's lexical-vs-syntactic clustering
//: family split exactly - this is NOT the same grouping as
//: featureNames.ts's display-label prefixes. lexical-set and named-entity
//: are labeled "Syntactic Similarity" there (that split is about
//: vocabulary vs. grammar), but cluster_methods.py documents both of
//: those two specifically as producing thematic, not genre, clusters:
//: "Sits between the lexical and syntactic families... read its clusters
//: as thematic leanings, not genre." If cluster_methods.py's family split
//: ever changes, this set needs updating to match - see that module's own
//: docstring for the authoritative grouping.
//:
//: alephbert-mean-pool/alephbert-soft-alignment (semantic_embedding.py)
//: are included for the same underlying reason via a different mechanism:
//: AlephBERT's strong genre-family AMI could reflect psalms clustering by
//: *content/theme* (an embedding space naturally groups "about praise"
//: text together) rather than Gunkel's actual form + Stimmung + Sitz im
//: Leben criteria - nothing built so far can tell those apart, so this
//: gets the same honest caution lexical similarity's coincidental
//: vocabulary correlation does. miqrabert-mean-pool/miqrabert-soft-
//: alignment are deliberately NOT included: both collapse to k=1 (no
//: structure found at all), so there is no signal to mis-attribute as
//: thematic-vs-genre in the first place - the same plain "no structure"
//: treatment text-type's own k=1 already gets.
//:
//: alephbert-soft-alignment-top-pc/alephbert-soft-alignment-whitened
//: (anisotropy_correction.py) are included for the same reason as raw
//: AlephBERT: top-PC removal and whitening are geometric corrections to
//: AlephBERT's embedding space, not a different encoder or a different
//: notion of similarity, so the same content/theme-vs-genre ambiguity
//: applies to their output regardless of which correction was applied
//: first. Mean-pool has no corrected counterpart to include here at all -
//: see semantic_embedding.py's module docstring: removing the corpus's
//: dominant shared direction pushes many psalms' total similarity-to-
//: corpus negative under mean-pooling specifically, which crashes
//: spectral clustering's degree normalization outright, so those two
//: variants were never shipped as Cluster-page methods.
//:
//: berel-mean-pool/berel-soft-alignment and neodictabert-soft-alignment
//: (semantic_embedding.py) are included for the same reason as AlephBERT:
//: each is a different Hebrew sentence encoder, but every encoder in this
//: module produces the same kind of vector-space embedding, so the same
//: content/theme-vs-genre ambiguity that applies to AlephBERT applies
//: regardless of which encoder produced the vectors or how strong its
//: genre-family AMI turns out to be. neodictabert-mean-pool is
//: deliberately NOT included, for the same reason as miqrabert-mean-pool/
//: miqrabert-soft-alignment above: it collapses to k=1 (no structure found
//: at all), so there is no signal to mis-attribute as thematic-vs-genre in
//: the first place.
//:
//: berel-soft-alignment-top-pc/berel-soft-alignment-whitened and
//: neodictabert-soft-alignment-top-pc/neodictabert-soft-alignment-whitened
//: (anisotropy_correction.py) are included for the same reason as
//: AlephBERT's own corrected variants: geometric corrections to an
//: existing encoder's embedding space, not a different notion of
//: similarity. All four found real k>1 structure (unlike neodictabert-
//: mean-pool's k=1), so there is real signal here whose theme-vs-genre
//: reading stays as ambiguous as any other embedding-based signal's.
//:
//: bge-multilingual-gemma2/qwen3-embedding/kalm-embedding/bge-m3/
//: me5-large-instruct (mean-pool and soft-alignment, vocalized and
//: unvocalized - 4 signals each) and gemini/openai/cohere/voyage (same
//: 4-signal shape, the four paid-API candidates) are included for the
//: identical reason as every embedding-based signal above: each is a
//: different encoder producing the same kind of vector-space embedding,
//: so the same content/theme-vs-genre ambiguity applies regardless of
//: which encoder produced the vectors, how strong its genre-family AMI
//: turns out to be, or which vocalization state fed it (see
//: semantic_embedding.py's module docstring: unlike every encoder above,
//: vocalization is a real ablation axis for these signals, not a settled
//: non-issue).
//:
//: gte-multilingual-base-soft-alignment-unvocalized is included on the
//: same basis as neodictabert-soft-alignment: real k=2 structure found
//: (confirmed against the real regenerated clustering.json), even though
//: its genre-family AMI (0.0018, p=0.36) is statistically indistinguishable
//: from noise - there's a real partition to (mis-)attribute either way.
//: gte-multilingual-base-mean-pool/-mean-pool-unvocalized/-soft-alignment
//: are deliberately NOT included, for the same reason as miqrabert-mean-
//: pool/miqrabert-soft-alignment/neodictabert-mean-pool above: confirmed
//: directly (real clustering.json) that all three collapse to k=1 - severe
//: embedding-space anisotropy/collapse (pairwise similarity 0.92-1.00), not
//: a genre-vs-theme ambiguity, so there's no signal here to mis-attribute
//: in the first place.
const THEMATIC_CLUSTER_SIGNALS = new Set([
  "lexical",
  "root",
  "named-entity-identity",
  "lexical-set",
  "named-entity",
  "alephbert-mean-pool",
  "alephbert-soft-alignment",
  "alephbert-soft-alignment-top-pc",
  "alephbert-soft-alignment-whitened",
  "neodictabert-soft-alignment",
  "berel-mean-pool",
  "berel-soft-alignment",
  "berel-soft-alignment-top-pc",
  "berel-soft-alignment-whitened",
  "neodictabert-soft-alignment-top-pc",
  "neodictabert-soft-alignment-whitened",
  "bge-multilingual-gemma2-mean-pool",
  "bge-multilingual-gemma2-mean-pool-unvocalized",
  "bge-multilingual-gemma2-soft-alignment",
  "bge-multilingual-gemma2-soft-alignment-unvocalized",
  "qwen3-embedding-mean-pool",
  "qwen3-embedding-mean-pool-unvocalized",
  "qwen3-embedding-soft-alignment",
  "qwen3-embedding-soft-alignment-unvocalized",
  "kalm-embedding-mean-pool",
  "kalm-embedding-mean-pool-unvocalized",
  "kalm-embedding-soft-alignment",
  "kalm-embedding-soft-alignment-unvocalized",
  "gemini-mean-pool",
  "gemini-mean-pool-unvocalized",
  "gemini-soft-alignment",
  "gemini-soft-alignment-unvocalized",
  "openai-mean-pool",
  "openai-mean-pool-unvocalized",
  "openai-soft-alignment",
  "openai-soft-alignment-unvocalized",
  "cohere-mean-pool",
  "cohere-mean-pool-unvocalized",
  "cohere-soft-alignment",
  "cohere-soft-alignment-unvocalized",
  "voyage-mean-pool",
  "voyage-mean-pool-unvocalized",
  "voyage-soft-alignment",
  "voyage-soft-alignment-unvocalized",
  "bge-m3-mean-pool",
  "bge-m3-mean-pool-unvocalized",
  "bge-m3-soft-alignment",
  "bge-m3-soft-alignment-unvocalized",
  "gte-multilingual-base-soft-alignment-unvocalized",
  "me5-large-instruct-mean-pool",
  "me5-large-instruct-mean-pool-unvocalized",
  "me5-large-instruct-soft-alignment",
  "me5-large-instruct-soft-alignment-unvocalized",
]);

/** Whether a Cluster-page method id clusters on vocabulary/content
 * (thematic groups - which words two psalms share) rather than on
 * grammatical form (the actual target of Gunkel's genre categories, and
 * the only family validated against his exemplars). A thematic signal's
 * purity/AMI/ARI against Gunkel's genres is a coincidence check, not a
 * validated claim - see ui/GenreAlignmentView.tsx. */
export function isThematicClustering(clusterMethodId: string): boolean {
  return THEMATIC_CLUSTER_SIGNALS.has(baseFeatureId(clusterMethodId));
}
