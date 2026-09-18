import styles from "./ModelDetail.module.css";

function Item({
  k,
  children,
}: {
  readonly k: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <span className={styles.item}>
      <span className={styles.k}>{k}</span>
      {children}
    </span>
  );
}

/** A bootstrapped point estimate with its 95% BCa interval. */
export function ScalarStat({
  label,
  point,
  ciLow,
  ciHigh,
}: {
  readonly label: string;
  readonly point: number;
  readonly ciLow: number;
  readonly ciHigh: number;
}): React.ReactElement {
  return (
    <>
      <Item k={label}>
        <span className={styles.v}>{point.toFixed(3)}</span>
      </Item>
      <Item k="95% ci">
        <span className={styles.v}>
          [{ciLow.toFixed(3)}, {ciHigh.toFixed(3)}]
        </span>
      </Item>
    </>
  );
}
