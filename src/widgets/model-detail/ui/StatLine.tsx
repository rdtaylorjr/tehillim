import styles from "./ModelDetail.module.css";
import type { GapStats } from "../model/types";

/** Below this the fixed-decimal printer would round a real p to a misleading 0.000. */
const P_FLOOR = 0.001;

const formatP = (p: number): string => (p < P_FLOOR ? "< 0.001" : p.toFixed(3));

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

/** A permutation-test gap, with the p-value marked significant or not. */
export function GapStat({ stats }: { readonly stats: GapStats }): React.ReactElement {
  const significant = stats.p < 0.05;
  return (
    <>
      <Item k="gap">
        <span className={styles.v}>{stats.gap.toFixed(4)}</span>
      </Item>
      <Item k="effect size">
        <span className={styles.v}>{stats.effect_size.toFixed(2)}</span>
      </Item>
      <Item k="p">
        <span className={`${styles.pill} ${significant ? styles.good : styles.warn}`}>
          {formatP(stats.p)}
          {significant ? "" : " (not significant)"}
        </span>
      </Item>
    </>
  );
}
