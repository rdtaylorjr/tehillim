import { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./dropdown.module.css";

export interface DropdownRowProps {
  /** The axis this row sets, omitted where the control already names itself. */
  readonly label?: string;
  readonly children: React.ReactNode;
}

/** One axis inside a menu. */
export function DropdownRow({ label, children }: DropdownRowProps): React.ReactElement {
  const id = useId();
  return (
    <div className={styles.row}>
      {label === undefined ? null : (
        <span className={styles.rowLabel} id={id}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

/** Boxes a PillGroup, which is display:contents and would take the row's gap. */
export function DropdownPills({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <div className={styles.pills}>{children}</div>;
}

export interface DropdownProps {
  /** What the whole control is called, beside the toggle. */
  readonly label: string;
  /** What is chosen right now, which the toggle reads. */
  readonly current: string;
  /** The axes the choice is made of, as `DropdownRow`s. */
  readonly children: React.ReactNode;
}

/** A toggle naming what is chosen, and the menu of axes that make up the choice. */
export function Dropdown({ label, current, children }: DropdownProps): React.ReactElement {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback((): void => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    //: composedPath() rather than contains(), since a re-render detaches the node.
    const onOutsideClick = (event: MouseEvent): void => {
      const anchor = anchorRef.current;
      if (anchor && !event.composedPath().includes(anchor)) close();
    };
    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("click", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [close, open]);

  return (
    <div className={styles.dropdown}>
      <span className={styles.dropdownLabel}>{label}</span>
      <div className={styles.anchor} ref={anchorRef}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          onClick={() => {
            setOpen((wasOpen) => !wasOpen);
          }}
        >
          {current}
        </button>
        <div className={`${styles.menu}${open ? ` ${styles.isOpen}` : ""}`} aria-label={label}>
          {children}
        </div>
      </div>
    </div>
  );
}
