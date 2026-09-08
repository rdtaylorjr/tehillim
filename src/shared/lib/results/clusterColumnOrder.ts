/** Genre-matched clusters first, in genre order, then the unmatched ones. */
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
