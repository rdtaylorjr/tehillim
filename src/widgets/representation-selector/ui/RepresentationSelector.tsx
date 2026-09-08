import { useCallback, useEffect, useMemo, useState } from "react";
import { Dropdown, DropdownPills, DropdownRow } from "../../../shared/ui/Dropdown";
import { PillGroup } from "../../../shared/ui/PillGroup";
import { featurePhrase } from "../../../shared/lib/corpus";
import { INITIAL_CHOICE, choiceOf, parseSignal, resolveChoice } from "../lib/signals";
import type { Choice } from "../lib/signals";

export interface RepresentationSelectorProps {
  /** Every method id this page's payload actually carries. */
  readonly availableIds: readonly string[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}

/** The representation as one dropdown, every row read off the ids the payload carries. */
export function RepresentationSelector({
  availableIds,
  value,
  onChange,
}: RepresentationSelectorProps): React.ReactElement {
  //: The parent's value changes only through this control, so the breakdown lives here.
  const [choice, setChoice] = useState<Choice>(() => ({
    ...INITIAL_CHOICE,
    ...choiceOf(value),
  }));

  const signals = useMemo(() => availableIds.map(parseSignal), [availableIds]);

  //: The suffix a synthesized id takes when the payload carries nothing at all.
  const suffix = useMemo(
    () => (availableIds[0]?.endsWith("-spectral") ? "-spectral" : "-tfidf-cosine"),
    [availableIds],
  );

  const resolved = useMemo(() => resolveChoice(signals, choice), [signals, choice]);
  const id = resolved.signal?.id ?? `${choice.model}${suffix}`;

  const pick = useCallback(
    (next: Partial<Choice>): void => {
      setChoice((prev) => {
        const merged = { ...prev, ...next };
        //: An axis the new model lacks is reset, so a stale value cannot reappear.
        const asked = new Set(resolveChoice(signals, merged).rows.map((row) => row.key));
        return {
          ...merged,
          text: asked.has("text") ? merged.text : INITIAL_CHOICE.text,
          correction: asked.has("correction") ? merged.correction : INITIAL_CHOICE.correction,
        };
      });
    },
    [signals],
  );

  useEffect(() => {
    onChange(id);
  }, [onChange, id]);

  return (
    <Dropdown label="Representation" current={featurePhrase(id)}>
      <DropdownRow>
        <DropdownPills>
          <PillGroup
            label="Models"
            options={resolved.families.map((family) => ({ id: family, label: family }))}
            value={resolved.family}
            onSelect={(family) => {
              pick({ family });
            }}
          />
        </DropdownPills>
      </DropdownRow>
      {resolved.rows.map((row) => (
        <DropdownRow key={row.key} label={row.label}>
          <select
            aria-label={row.label}
            value={row.value}
            onChange={(event) => {
              pick({ [row.key]: event.target.value });
            }}
          >
            {row.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DropdownRow>
      ))}
    </Dropdown>
  );
}
