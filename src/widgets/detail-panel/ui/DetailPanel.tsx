import styles from "./DetailPanel.module.css";
import panel from "../../../shared/ui/panel.module.css";
import { createSimilarityColorScale } from "../../../shared/lib/color";
import { topMatches } from "../../../shared/lib/ranking";
import type {
  ClusterMethodPayload,
  FeatureScore,
  MethodPayload,
  PsalmCore,
} from "../../../shared/model";

export interface DetailShellProps {
  readonly children: React.ReactNode;
}

/** The aside both pages fill, so the column keeps its size whatever is in it. */
export function DetailShell({ children }: DetailShellProps): React.ReactElement {
  return (
    <aside className={`${panel.panel} ${styles.detailPanel}`} aria-label="Psalm detail">
      {children}
    </aside>
  );
}

export interface EmptyDetailProps {
  readonly children: React.ReactNode;
}

export function EmptyDetail({ children }: EmptyDetailProps): React.ReactElement {
  return <div className={styles.detailEmpty}>{children}</div>;
}

function FeatureChip({ feature }: { readonly feature: FeatureScore }): React.ReactElement {
  return (
    <span className={styles.lexemeChip}>
      <span className={styles.lemma}>{feature.label}</span>
      <span>{feature.description || feature.category}</span>
    </span>
  );
}

interface StatProps {
  readonly value: string;
  readonly label: string;
}

function Stat({ value, label }: StatProps): React.ReactElement {
  return (
    <span>
      <b>{value}</b>
      {label ? ` ${label}` : ""}
    </span>
  );
}

interface DetailHeaderProps {
  readonly psalm: PsalmCore;
  readonly stats: readonly StatProps[];
}

function DetailHeader({ psalm, stats }: DetailHeaderProps): React.ReactElement {
  return (
    <div className={styles.detailHeader}>
      <div className={styles.detailNumber}>Psalm {psalm.number}</div>
      <p className={styles.detailIncipit}>{psalm.incipit}</p>
      <div className={styles.detailStats}>
        {stats.map((stat) => (
          <Stat key={`${stat.value} ${stat.label}`} value={stat.value} label={stat.label} />
        ))}
      </div>
    </div>
  );
}

export interface DetailPanelProps {
  readonly psalms: readonly PsalmCore[];
  readonly method: MethodPayload;
  readonly psalmNumber: number;
  readonly onSelectPsalm: (psalm: number) => void;
}

/** The psalm's facts, the terms driving its score, and its closest matches. */
export function DetailPanel({
  psalms,
  method,
  psalmNumber,
  onSelectPsalm,
}: DetailPanelProps): React.ReactElement {
  const psalm = psalms.find((p) => p.number === psalmNumber);
  const stats = method.psalmStats.find((s) => s.number === psalmNumber);
  if (!psalm || !stats) {
    return (
      <EmptyDetail>
        Select a psalm from the grid or the visualization to see its closest matches.
      </EmptyDetail>
    );
  }

  const matches = topMatches(method, psalmNumber, 10);
  const best = matches[0]?.score ?? 0;
  const barColor = createSimilarityColorScale(Math.max(best, 0.01));

  return (
    <>
      <DetailHeader
        psalm={psalm}
        stats={[
          { value: String(psalm.verseCount), label: "verses" },
          { value: String(psalm.wordCount), label: "words" },
          { value: String(stats.uniqueTermCount), label: "distinct terms" },
        ]}
      />

      {stats.topTerms.length > 0 ? (
        <div className={styles.detailLexemes}>
          {stats.topTerms.slice(0, 6).map((term) => (
            <FeatureChip key={`${term.category}/${term.label}`} feature={term} />
          ))}
        </div>
      ) : null}

      <h2 className={styles.similarHeading}>Most similar psalms</h2>
      <ul className={styles.similarList}>
        {matches.map((match) => {
          const matchPsalm = psalms.find((p) => p.number === match.psalm);
          return (
            <li key={match.psalm}>
              <button
                type="button"
                className={styles.similarItem}
                onClick={() => {
                  onSelectPsalm(match.psalm);
                }}
              >
                <span className={styles.similarItemTop}>
                  <span className={styles.similarItemPsalm}>Psalm {match.psalm}</span>
                  <span className={styles.similarItemScore}>{match.score.toFixed(3)}</span>
                </span>
                <span className={styles.similarItemBarTrack}>
                  <span
                    className={styles.similarItemBarFill}
                    style={{
                      display: "block",
                      width: `${String((match.score / (best || 1)) * 100)}%`,
                      background: barColor(match.score),
                    }}
                  />
                </span>
                <p className={styles.similarItemIncipit}>{matchPsalm?.incipit ?? ""}</p>
                <span className={styles.similarItemShared}>
                  {match.sharedTerms.slice(0, 4).map((term) => (
                    <FeatureChip key={`${term.category}/${term.label}`} feature={term} />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export interface ClusterDetailPanelProps {
  readonly psalms: readonly PsalmCore[];
  readonly method: ClusterMethodPayload;
  readonly psalmNumber: number;
  readonly onSelectPsalm: (psalm: number) => void;
}

/** The cluster counterpart: every other psalm sharing this psalm's cluster. */
export function ClusterDetailPanel({
  psalms,
  method,
  psalmNumber,
  onSelectPsalm,
}: ClusterDetailPanelProps): React.ReactElement {
  const psalm = psalms.find((p) => p.number === psalmNumber);
  const clusterIndex = method.assignments[String(psalmNumber)];
  const cluster = method.clusters.find((c) => c.index === clusterIndex);
  if (!psalm || !cluster) {
    return (
      <EmptyDetail>
        Select a psalm from the grid to see its cluster and fellow members.
      </EmptyDetail>
    );
  }

  const otherMembers = cluster.psalmNumbers.filter((number) => number !== psalmNumber);

  return (
    <>
      <DetailHeader
        psalm={psalm}
        stats={[
          { value: String(psalm.verseCount), label: "verses" },
          { value: `Cluster ${String(cluster.index + 1)}`, label: "" },
          { value: String(cluster.size), label: "psalms in cluster" },
        ]}
      />

      <h2 className={styles.similarHeading}>Cluster {cluster.index + 1} members</h2>
      <ul className={styles.similarList}>
        {otherMembers.map((memberNumber) => {
          const memberPsalm = psalms.find((p) => p.number === memberNumber);
          return (
            <li key={memberNumber}>
              <button
                type="button"
                className={styles.similarItem}
                onClick={() => {
                  onSelectPsalm(memberNumber);
                }}
              >
                <span className={styles.similarItemTop}>
                  <span className={styles.similarItemPsalm}>Psalm {memberNumber}</span>
                </span>
                <p className={styles.similarItemIncipit}>{memberPsalm?.incipit ?? ""}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
