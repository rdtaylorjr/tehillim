import { visibleSourcesForMetric } from "./validationRow";
import type { ValidationRow } from "../../../shared/lib/results";
import type { TrajectoryControl } from "../../../shared/lib/corpus";

export interface Column {
  key: string;
  label: string;
  type: "num" | "pill";
  digits?: number;
  pillPrefix?: "p" | "q";
}

/** The chosen control's statistics, or none where no row in the group carries that control. */
export function trajectoryColumns(rows: ValidationRow[], control: TrajectoryControl): Column[] {
  //: `raw` is never shown, since its gap tracks `length_controlled` at r=0.91-0.99.
  if (!visibleSourcesForMetric(rows).includes(control)) return [];
  return [
    { key: `${control}_effect_size`, label: "Effect size", type: "num", digits: 3 },
    { key: `${control}_gap`, label: "Gap", type: "num", digits: 5 },
    { key: `${control}_p`, label: "p", type: "pill", pillPrefix: "p" },
    { key: `${control}_q`, label: "q", type: "pill", pillPrefix: "q" },
  ];
}
