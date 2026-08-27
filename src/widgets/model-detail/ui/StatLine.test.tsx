import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GapStat, ScalarStat } from "./StatLine";

describe("ScalarStat", () => {
  it("states the estimate and its interval at the precision the source formatter used", () => {
    cleanup();
    render(<ScalarStat label="auc" point={0.87654} ciLow={0.8123} ciHigh={0.9234} />);
    expect(screen.getByText("auc")).toBeInTheDocument();
    expect(screen.getByText("0.877")).toBeInTheDocument();
    expect(screen.getByText("[0.812, 0.923]")).toBeInTheDocument();
  });
});

describe("GapStat", () => {
  it("marks a significant gap good", () => {
    cleanup();
    render(<GapStat stats={{ gap: 0.0612, p: 0.0031, effect_size: 1.24 }} />);
    expect(screen.getByText("0.0612")).toBeInTheDocument();
    expect(screen.getByText("1.24")).toBeInTheDocument();
    expect(screen.getByText("0.003")).toHaveClass("good");
  });

  it("marks a non-significant gap warn, and says so", () => {
    cleanup();
    render(<GapStat stats={{ gap: 0.001, p: 0.42, effect_size: 0.1 }} />);
    const pill = screen.getByText(/0.420/);
    expect(pill).toHaveClass("warn");
    expect(pill).toHaveTextContent("not significant");
  });

  it("floors a vanishing p rather than printing it as zero", () => {
    cleanup();
    render(<GapStat stats={{ gap: 0.2, p: 1e-9, effect_size: 3 }} />);
    expect(screen.getByText(/< 0.001/)).toBeInTheDocument();
  });
});
