/** How far a fixed-size chart must shrink to sit inside the width available, never enlarging it. */
export function fitScale(naturalWidth: number, availableWidth: number): number {
  if (naturalWidth <= 0 || availableWidth <= 0) return 1;
  return Math.min(1, availableWidth / naturalWidth);
}
