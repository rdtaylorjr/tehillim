import { describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useMinorCrumbFit } from "./useMinorCrumbFit";
import type { ObserverFactory } from "./useMinorCrumbFit";

/** The scoped names the toolbar passes in; the test uses plain ones for readable selectors. */
const NAMES = { crumbs: "crumbs", hideMinor: "hide-minor" };

/** Widths jsdom will not compute on its own, so the measurement has something to read. */
function sizeRow(
  row: HTMLElement,
  opts: { crumbsOverflow: boolean; fieldWidth: number },
): void {
  const crumbs = row.querySelector<HTMLElement>(".crumbs")!;
  Object.defineProperty(crumbs, "scrollWidth", {
    value: opts.crumbsOverflow ? 400 : 100,
    configurable: true,
  });
  Object.defineProperty(crumbs, "clientWidth", { value: 100, configurable: true });
  const field = row.querySelector("input")!;
  field.getBoundingClientRect = () => ({ width: opts.fieldWidth }) as DOMRect;
}

function Row({
  createObserver,
  onMount,
}: {
  createObserver?: ObserverFactory;
  onMount: (row: HTMLElement) => void;
}): React.ReactElement {
  const ref = useMinorCrumbFit("path", NAMES, createObserver);
  return (
    <div
      className="summary"
      ref={(node) => {
        ref.current = node;
        if (node) onMount(node);
      }}
    >
      <span className="crumbs">Semantic × Parallelism</span>
      <input type="text" />
    </div>
  );
}

/** Renders once so the ref callback can size the row before the layout effect measures it. */
function renderRow(opts: { crumbsOverflow: boolean; fieldWidth: number }): HTMLElement {
  cleanup();
  let row!: HTMLElement;
  render(
    <Row
      createObserver={() => ({ observe: () => undefined, disconnect: () => undefined })}
      onMount={(node) => {
        row = node;
        sizeRow(node, opts);
      }}
    />,
  );
  return row;
}

describe("useMinorCrumbFit", () => {
  it("leaves the minors alone while the path fits and the field is whole", () => {
    const row = renderRow({ crumbsOverflow: false, fieldWidth: 200 });
    expect(row.classList.contains("hide-minor")).toBe(false);
  });

  it("drops the minors once the path no longer fits", () => {
    const row = renderRow({ crumbsOverflow: true, fieldWidth: 200 });
    expect(row.classList.contains("hide-minor")).toBe(true);
  });

  it("drops the minors before the field is asked to narrow", () => {
    const row = renderRow({ crumbsOverflow: false, fieldWidth: 160 });
    expect(row.classList.contains("hide-minor")).toBe(true);
  });

  it("re-measures when the observer reports a resize", () => {
    cleanup();
    let fire = (): void => undefined;
    let row!: HTMLElement;
    render(
      <Row
        createObserver={(callback) => {
          fire = callback;
          return { observe: () => undefined, disconnect: () => undefined };
        }}
        onMount={(node) => {
          row = node;
          sizeRow(node, { crumbsOverflow: false, fieldWidth: 200 });
        }}
      />,
    );
    expect(row.classList.contains("hide-minor")).toBe(false);

    sizeRow(row, { crumbsOverflow: true, fieldWidth: 200 });
    fire();
    expect(row.classList.contains("hide-minor")).toBe(true);
  });

  it("recovers the minors when the room comes back, never latching on", () => {
    cleanup();
    let fire = (): void => undefined;
    let row!: HTMLElement;
    render(
      <Row
        createObserver={(callback) => {
          fire = callback;
          return { observe: () => undefined, disconnect: () => undefined };
        }}
        onMount={(node) => {
          row = node;
          sizeRow(node, { crumbsOverflow: true, fieldWidth: 200 });
        }}
      />,
    );
    expect(row.classList.contains("hide-minor")).toBe(true);

    sizeRow(row, { crumbsOverflow: false, fieldWidth: 200 });
    fire();
    expect(row.classList.contains("hide-minor")).toBe(false);
  });
});
