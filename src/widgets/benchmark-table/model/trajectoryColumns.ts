import { visibleSourcesForMetric } from "./validationRow";
import type { Source, ValidationRow } from "../../../shared/lib/results";

export interface Column {
  key: string;
  label: string;
  type: "num" | "pill";
  digits?: number;
  pillPrefix?: "p" | "q";
}

/** Every displayed source is length-controlled, so only one needs a label prefix. */
const SOURCE_PREFIX: Record<Source, string> = {
  raw: "Raw",
  length_controlled: "",
  length_and_content_controlled: "Content-ctrl",
};

/** `raw` is never shown, since its gap tracks `length_controlled` at r=0.91-0.99. */
const DISPLAYED_SOURCES: readonly Source[] = [
  "length_controlled",
  "length_and_content_controlled",
];

function fieldLabel(prefix: string, base: string): string {
  if (prefix) return `${prefix} ${base}`;
  return base.length > 1 ? base.charAt(0).toUpperCase() + base.slice(1) : base;
}

function statColumns(source: Source): Column[] {
  const prefix = SOURCE_PREFIX[source];
  return [
    {
      key: `${source}_effect_size`,
      label: fieldLabel(prefix, "effect size"),
      type: "num",
      digits: 3,
    },
    {
      key: `${source}_gap`,
      label: fieldLabel(prefix, "gap"),
      type: "num",
      digits: 5,
    },
    {
      key: `${source}_p`,
      label: fieldLabel(prefix, "p"),
      type: "pill",
      pillPrefix: "p",
    },
    {
      key: `${source}_q`,
      label: fieldLabel(prefix, "q"),
      type: "pill",
      pillPrefix: "q",
    },
  ];
}

/** Column set for one trajectory metric's table, hiding a source entirely when no row in the group has it. */
export function trajectoryColumns(rows: ValidationRow[]): Column[] {
  const visible = visibleSourcesForMetric(rows);
  return DISPLAYED_SOURCES.filter((source) => visible.includes(source)).flatMap(statColumns);
}
