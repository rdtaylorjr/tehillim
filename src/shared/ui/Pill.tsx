import styles from "./Pill.module.css";
import { formatNumber } from "../lib/results";
import { formatPValue, formatQValue } from "../lib/results";

export type PillPrefix = "p" | "q";

/** Below 0.001 the fixed-decimal printers would round to a misleading 0.0000. */
const FLOOR = 0.001;

function severityClass(value: number): "good" | "warn" | "bad" {
  if (value < 0.01) return "good";
  if (value < 0.05) return "warn";
  return "bad";
}

/** Color-coded significance pill; nothing at all for a non-finite value. */
export function significancePill(value: number, prefix: PillPrefix = "p"): React.ReactNode {
  if (!Number.isFinite(value)) return "";
  const text =
    value < FLOOR ? "<0.001" : prefix === "q" ? formatQValue(value) : formatPValue(value);
  return (
    <span className={`${styles.pill} ${styles[severityClass(value)]}`}>
      {prefix}={text}
    </span>
  );
}

/**
 * Color-coded confidence-interval pill: good when the whole interval sits above `reference`
 * (higher is better throughout this UI), bad otherwise. One CI is the sole source for both the
 * printed range and its color, so it can never disagree with a separately-computed q-value.
 */
export function ciPill(low: number, high: number, reference: number): React.ReactNode {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return "—";
  return (
    <span className={`${styles.pill} ${low > reference ? styles.good : styles.bad}`}>
      [{formatNumber(low, 4)}, {formatNumber(high, 4)}]
    </span>
  );
}
