/**
 * Orders cluster indices for display: clusters matched to a genre (see
 * pipeline/genre_alignment.py's Hungarian-algorithm matching) come first,
 * ordered by that genre's position in `genreOrder` - so scanning down a
 * genre's row, its matched cluster (if any) tends to sit near that row's
 * own position rather than at an arbitrary column. Unmatched clusters are
 * appended afterward, in their original index order.
 */
export function orderClustersByGenre(
  clusterGenreLabels: (string | null)[],
  genreOrder: readonly string[],
): number[] {
  const genrePosition = new Map(genreOrder.map((genre, index) => [genre, index]));
  const indices = clusterGenreLabels.map((_, index) => index);

  return [...indices].sort((a, b) => {
    const genreA = clusterGenreLabels[a];
    const genreB = clusterGenreLabels[b];
    const posA = genreA !== null ? (genrePosition.get(genreA) ?? Infinity) : Infinity;
    const posB = genreB !== null ? (genrePosition.get(genreB) ?? Infinity) : Infinity;
    if (posA !== posB) return posA - posB;
    return a - b;
  });
}
