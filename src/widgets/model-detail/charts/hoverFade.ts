/** Long enough to cross the gap between two traces, short enough to feel like leaving the chart. */
export const FADE_SETTLE_MS = 90;

export interface HoverFade {
  enter: (curveNumber: number) => void;
  leave: () => void;
  dispose: () => void;
}

/** Dims the traces not pointed at, the restore waiting so passing never flashes. */
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
