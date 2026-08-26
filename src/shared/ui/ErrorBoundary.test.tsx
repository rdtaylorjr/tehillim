import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom(): React.ReactElement {
  throw new Error("render failed");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // React logs the caught error itself; the test asserts behaviour, not console noise.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders its children while nothing has failed", () => {
    render(
      <ErrorBoundary>
        <p>all well</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("all well")).toBeInTheDocument();
  });

  it("states the failure instead of leaving a blank page", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
  });

  it("reports the failure for diagnosis rather than swallowing it", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalled();
  });
});
