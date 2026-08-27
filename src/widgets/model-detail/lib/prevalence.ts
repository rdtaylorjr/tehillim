/** The positive-class fraction, used as the PR curve's chance-level reference line. */
export function computePrevalence(positiveN: number, negativeN: number): number {
  const total = positiveN + negativeN;
  return total === 0 ? 0 : positiveN / total;
}
