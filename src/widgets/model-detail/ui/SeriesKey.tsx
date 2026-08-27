import styles from "./ModelDetail.module.css";

export interface SeriesKeyProps {
  readonly names: readonly string[];
  readonly color: (name: string) => string;
}

/** One key for the whole section, since every chart below it colours the same series alike. */
export function SeriesKey({ names, color }: SeriesKeyProps): React.ReactElement | null {
  if (names.length === 0) return null;
  return (
    <ul className={styles.seriesKey}>
      {names.map((name) => (
        <li className={styles.seriesItem} key={name}>
          <span className={styles.swatch} data-swatch style={{ background: color(name) }} />
          {name}
        </li>
      ))}
    </ul>
  );
}
