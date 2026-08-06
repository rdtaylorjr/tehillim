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
const THEMATIC_CLUSTER_SIGNALS = new Set([
  "lexical",
  "root",
  "named-entity-identity",
  "lexical-set",
  "named-entity",
]);

/** Whether a Cluster-page method id clusters on vocabulary/content
 * (thematic groups - which words two psalms share) rather than on
 * grammatical form (the actual target of Gunkel's genre categories, and
 * the only family validated against his exemplars). A thematic signal's
 * purity/AMI/ARI against Gunkel's genres is a coincidence check, not a
 * validated claim - see components/genreAlignmentView.ts. */
export function isThematicClustering(clusterMethodId: string): boolean {
  return THEMATIC_CLUSTER_SIGNALS.has(baseFeatureId(clusterMethodId));
}
