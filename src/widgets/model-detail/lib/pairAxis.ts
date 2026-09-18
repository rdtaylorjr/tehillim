import type { AxisEntry, GenreOrderEntry, ItemPairCell, PairCell } from "../model/types";

/** A register's passages on the axis under the labels the export gave them, and its cells by id. */
export function passageAxis(
  order: readonly GenreOrderEntry[],
  cells: readonly ItemPairCell[],
): { order: AxisEntry[]; cells: PairCell[] } {
  return {
    order: order.map((o) => ({ key: o.item, label: o.label, genre: o.genre })),
    cells: cells.map((c) => ({ a: c.item_a, b: c.item_b, value: c.value })),
  };
}
