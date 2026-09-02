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
    const genreA = clusterGenreLabels[a] ?? null;
    const genreB = clusterGenreLabels[b] ?? null;
    const posA = genreA === null ? Infinity : (genrePosition.get(genreA) ?? Infinity);
    const posB = genreB === null ? Infinity : (genrePosition.get(genreB) ?? Infinity);
    if (posA !== posB) return posA - posB;
    return a - b;
  });
}
