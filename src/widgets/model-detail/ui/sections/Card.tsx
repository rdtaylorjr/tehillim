import styles from "../ModelDetail.module.css";

export interface CardProps {
  readonly title: string;
  readonly stat?: React.ReactNode;
  readonly wide?: boolean;
  readonly children: React.ReactNode;
}

/** One titled chart panel, optionally carrying the statistic that chart visualizes. */
export function Card({ title, stat, wide, children }: CardProps): React.ReactElement {
  return (
    <section className={wide === true ? `${styles.card} ${styles.spanAll}` : styles.card}>
      <h4 className={styles.cardTitle}>{title}</h4>
      {stat === undefined ? null : <p className={styles.cardStat}>{stat}</p>}
      {children}
    </section>
  );
}
