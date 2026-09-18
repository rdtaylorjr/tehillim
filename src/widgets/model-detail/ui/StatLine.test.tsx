import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ScalarStat } from "./StatLine";

describe("ScalarStat", () => {
  it("states the estimate and its interval at the precision the source formatter used", () => {
    cleanup();
    render(<ScalarStat label="auc" point={0.87654} ciLow={0.8123} ciHigh={0.9234} />);
    expect(screen.getByText("auc")).toBeInTheDocument();
    expect(screen.getByText("0.877")).toBeInTheDocument();
    expect(screen.getByText("[0.812, 0.923]")).toBeInTheDocument();
  });
});
