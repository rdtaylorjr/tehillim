import styles from "./PillGroup.module.css";

export interface PillOption {
  readonly id: string;
  readonly label: string;
}

export interface PillGroupProps {
  readonly label: string;
  readonly options: readonly PillOption[];
  readonly value: string;
  readonly onSelect: (id: string) => void;
}

/** A single-select group of pills, exposed as a radiogroup so it reads as one choice. */
export function PillGroup({
  label,
  options,
  value,
  onSelect,
}: PillGroupProps): React.ReactElement {
  return (
    <div className={styles.pillGroupLoose} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          className={`${styles.pill}${option.id === value ? ` ${styles.isSelected}` : ""}`}
          onClick={() => {
            onSelect(option.id);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
