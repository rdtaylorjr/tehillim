import { useId } from "react";
import styles from "./Field.module.css";

export interface SelectOption<V extends string = string> {
  readonly value: V;
  readonly label: string;
}

export interface SelectControlProps<V extends string> {
  readonly label: string;
  readonly options: readonly SelectOption<V>[];
  readonly value: V;
  readonly onSelect: (value: V) => void;
}

/**
 * A labelled select, its id generated so the same control can appear more than once. The chosen
 * value is read back off the options rather than cast, so the callback keeps their exact type.
 */
export function SelectControl<V extends string>({
  label,
  options,
  value,
  onSelect,
}: SelectControlProps<V>): React.ReactElement {
  const id = useId();
  return (
    <div className={styles.control}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const chosen = options.find((option) => option.value === event.target.value);
          if (chosen) onSelect(chosen.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
