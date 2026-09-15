import type { SelectOption } from "../../../shared/ui/SelectControl";

/** Keeps each dropdown's option type exactly the union its values came from. */
export const asOptions = <V extends string>(
  values: readonly V[],
  label: (value: V) => string,
): SelectOption<V>[] => values.map((value) => ({ value, label: label(value) }));
