import styles from "./GenreAlignmentView.module.css";
import { Caveat } from "../../../widgets/viz-panel";
import { AlluvialDiagram } from "../../../shared/ui/AlluvialDiagram";
import { computeShare, isDarkCell, isSelectedCell } from "../../../shared/lib/results";
import type { SelectedAlignmentCell } from "../../../shared/lib/results";
import { createAlignmentColorScale } from "../../../shared/lib/color";
import { orderClustersByGenre } from "../../../shared/lib/results";
import { isThematicClustering } from "../lib/clusterFamily";
import type { GenreAlignment } from "../../../shared/model";

const STATS: readonly { key: "purity" | "ami" | "ari"; label: string; description: string }[] =
  [
    {
      key: "purity",
      label: "Purity",
      description: "Share of each cluster taken by its single largest genre.",
    },
    {
      key: "ami",
      label: "AMI",
      description:
        "Adjusted Mutual Information, corrected for chance agreement: ~0 means this partition is no better than a random one of the same sizes; 1 means an exact match.",
    },
    {
      key: "ari",
      label: "ARI",
      description:
        "Adjusted Rand Index: agreement on which psalm pairs are grouped together, corrected for chance.",
    },
  ];

const SHADE_STEPS = 12;

/** The exact-counts table, columns ordered by the Hungarian genre assignment. */
function AlignmentMatrix({
  alignment,
  selected,
}: {
  readonly alignment: GenreAlignment;
  readonly selected: SelectedAlignmentCell | null;
}): React.ReactElement {
  const cellColor = createAlignmentColorScale();
  const columnOrder = orderClustersByGenre(alignment.clusterGenreLabels, alignment.genres);

  return (
    <>
      <div className={styles.alignmentLegend}>
        <span>Number = psalm count in that genre × cluster cell.</span>
        <span className={styles.alignmentLegendShade}>
          <span>0%</span>
          <span className={styles.alignmentLegendBar}>
            {Array.from({ length: SHADE_STEPS + 1 }, (_, i) => i / SHADE_STEPS).map((stop) => (
              <span key={stop} style={{ background: cellColor(stop) }} />
            ))}
          </span>
          <span>100%</span>
          <span>of the genre&rsquo;s psalms in that cluster (darker = more concentrated)</span>
        </span>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.alignmentTable}>
          <thead>
            <tr>
              <th
                className={styles.alignmentCorner}
                title="Each row is a Gunkel genre or family; each column is one of this signal's clusters."
              >
                Category
              </th>
              {columnOrder.map((clusterIndex) => {
                const matched = alignment.clusterGenreLabels[clusterIndex] ?? null;
                return (
                  <th
                    key={clusterIndex}
                    className={styles.alignmentClusterHeader}
                    title={
                      matched
                        ? `Cluster ${String(clusterIndex + 1)}. Best matches "${matched}"`
                        : `Cluster ${String(clusterIndex + 1)}. No genre matched strongly enough`
                    }
                  >
                    <div className={styles.alignmentClusterNumber}>
                      Cluster {clusterIndex + 1}
                    </div>
                    <div className={styles.alignmentClusterGenre}>
                      {matched ? `best match: ${matched}` : "no strong match"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {alignment.genres.map((genre, genreIndex) => {
              const total = alignment.genreTotals[genreIndex] ?? 0;
              const counts = alignment.counts[genreIndex] ?? [];
              return (
                <tr key={genre}>
                  <th scope="row" className={styles.alignmentRowHeader}>
                    <span className={styles.alignmentGenreName}>{genre}</span>
                    <span className={styles.alignmentGenreTotal}>{total} psalms</span>
                  </th>
                  {columnOrder.map((clusterIndex) => {
                    const count = counts[clusterIndex] ?? 0;
                    const share = computeShare(count, total);
                    return (
                      <td
                        key={clusterIndex}
                        style={{ background: cellColor(share) }}
                        className={[
                          count > 0 && isDarkCell(share) ? styles.isDark : "",
                          isSelectedCell(genre, clusterIndex, selected)
                            ? styles.isSelectedCell
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        {...(count > 0
                          ? {
                              title: `${String(count)} of ${String(total)} ${genre} psalms in Cluster ${String(clusterIndex + 1)} (${String(Math.round(share * 100))}%)`,
                            }
                          : {})}
                      >
                        {count > 0 ? count : ""}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export interface GenreAlignmentViewProps {
  readonly alignment: GenreAlignment;
  readonly genreColorOf: (genre: string) => string;
  readonly selected: SelectedAlignmentCell | null;
  /** Decides whether the "thematic, not genre" caveat is shown. */
  readonly clusterMethodId: string;
}

/** The alluvial, then the scorecard, then the exact counts behind a disclosure. */
export function GenreAlignmentView({
  alignment,
  genreColorOf,
  selected,
  clusterMethodId,
}: GenreAlignmentViewProps): React.ReactElement {
  return (
    <>
      {isThematicClustering(clusterMethodId) ? (
        <Caveat>
          Thematic signal, not genre. This clusters on shared vocabulary, not grammatical form,
          so the numbers below are a coincidence check against Gunkel&rsquo;s genres, not a
          validated recovery claim.
        </Caveat>
      ) : null}

      <AlluvialDiagram alignment={alignment} genreColorOf={genreColorOf} selected={selected} />

      <div className={styles.alignmentStatTiles}>
        {STATS.map((stat) => (
          <div key={stat.key} className={styles.alignmentStatTile} title={stat.description}>
            <div className={styles.alignmentStatValue}>{alignment[stat.key].toFixed(2)}</div>
            <div className={styles.alignmentStatLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <details className={styles.alignmentDetail}>
        <summary>Exact counts</summary>
        <AlignmentMatrix alignment={alignment} selected={selected} />
      </details>
    </>
  );
}
