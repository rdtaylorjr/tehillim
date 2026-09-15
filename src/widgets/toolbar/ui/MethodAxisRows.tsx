import { NO_CORRECTION, axisLabel } from "../../../shared/lib/navigation";
import type { MethodChoiceAction, MethodResolution } from "../../../shared/lib/navigation";
import { DropdownRow } from "../../../shared/ui/Dropdown";
import { asOptions } from "../lib/options";

export interface MethodAxisRowsProps {
  readonly resolved: MethodResolution;
  readonly dispatch: (action: MethodChoiceAction) => void;
}

/** The rows above the model for the axes a compare method carries, each shown only where it varies. */
export function MethodAxisRows({
  resolved,
  dispatch,
}: MethodAxisRowsProps): React.ReactElement {
  return (
    <>
      {resolved.aggregations.length > 1 ? (
        <DropdownRow label="Aggregation">
          <select
            aria-label="Aggregation"
            value={resolved.method?.aggregation ?? ""}
            onChange={(event) => {
              dispatch({ type: "aggregation/selected", aggregation: event.target.value });
            }}
          >
            {asOptions(resolved.aggregations, axisLabel).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DropdownRow>
      ) : null}
      {resolved.corrections.length > 1 ? (
        <DropdownRow label="Correction">
          <select
            aria-label="Correction"
            value={resolved.method?.correction ?? NO_CORRECTION}
            onChange={(event) => {
              dispatch({ type: "correction/selected", correction: event.target.value });
            }}
          >
            {asOptions(resolved.corrections, axisLabel).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DropdownRow>
      ) : null}
    </>
  );
}
