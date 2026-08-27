/** Long enough to cross the gap between two traces, short enough to feel like leaving the chart. */
export const FADE_SETTLE_MS = 90;

export interface HoverFade {
  enter: (curveNumber: number) => void;
  leave: () => void;
  dispose: () => void;
}

/**
 * Dims the traces a reader is not pointing at. The restore waits, so moving from one trace straight
 * to the next never flashes every trace back to full on the way past.
 */
export function createHoverFade(
  dim: (active: number) => void,
  restore: () => void,
  settleMs: number = FADE_SETTLE_MS,
): HoverFade {
  let pending: ReturnType<typeof setTimeout> | undefined;
  const cancel = (): void => {
    clearTimeout(pending);
    pending = undefined;
  };
  return {
    enter: (curveNumber) => {
      cancel();
      dim(curveNumber);
    },
    leave: () => {
      cancel();
      pending = setTimeout(restore, settleMs);
    },
    dispose: cancel,
  };
}
