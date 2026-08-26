import styles from "../ui/ResultsTable.module.css";

export interface VariantLabelRow {
  model_base?: string;
  text_variant?: string;
}

/** True when the row carries a real text variant, "unknown" standing for none. */
export function hasVariantTag(row: VariantLabelRow): boolean {
  return row.text_variant !== undefined && row.text_variant !== "unknown";
}

/** "model_base" alone, or "model_base <tag>variant</tag>" when a real text variant is present. */
export function variantLabel(row: VariantLabelRow): React.ReactNode {
  const base = row.model_base ?? "";
  if (!hasVariantTag(row)) return base;
  return (
    <>
      {base} <span className={styles.variantTag}>{row.text_variant}</span>
    </>
  );
}
