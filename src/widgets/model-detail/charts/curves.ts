import { plotly } from "./plot";
import type { PlotFn } from "./plot";
import * as Plotly from "plotly.js-dist-min";
import type { Data } from "plotly.js";
import { TOKENS } from "../model/tokens";
import type { CurveSeries } from "../model/types";
import { baseLayout, PLOTLY_CONFIG } from "./baseLayout";
import { createHoverFade } from "./hoverFade";

/** Mounts an ROC or PR curve (one dotted reference line plus one line per series, hover-dimming the rest). */
export function mountMultiCurve(
  mount: HTMLElement,
  seriesList: CurveSeries[],
  curveKey: "roc" | "pr",
  xField: string,
  yField: string,
  xTitle: string,
  yTitle: string,
  colorFn: (name: string) => string,
  refPoints: { x: number; y: number }[],
  showLegend = true,
  plot: PlotFn = plotly,
): void {
  const traces: Data[] = [
    {
      type: "scatter",
      mode: "lines",
      x: refPoints.map((p) => p.x),
      y: refPoints.map((p) => p.y),
      line: { color: TOKENS.inkFaint, width: 1, dash: "dot" },
      hoverinfo: "skip",
      showlegend: false,
    },
    ...seriesList.map((s): Data => ({
      type: "scatter",
      mode: "lines",
      name: s.name,
      x: s[curveKey].map((p) => (p as unknown as Record<string, number>)[xField]) as number[],
      y: s[curveKey].map((p) => (p as unknown as Record<string, number>)[yField]) as number[],
      line: { color: colorFn(s.name), width: 1.5 },
      hovertemplate: `${s.name}<br>${xTitle}: %{x:.3f}<br>${yTitle}: %{y:.3f}<extra></extra>`,
    })),
  ];

  const layout = baseLayout({
    xaxis: {
      title: { text: xTitle },
      range: [0, 1],
      zeroline: false,
      gridcolor: TOKENS.rule,
    },
    yaxis: {
      title: { text: yTitle },
      range: [0, 1],
      zeroline: false,
      gridcolor: TOKENS.rule,
    },
    legend: { font: { size: 9.5 } },
    showlegend: showLegend,
    height: 380,
  });

  void plot(mount, traces, layout, PLOTLY_CONFIG);
  const gd = mount as unknown as Plotly.PlotlyHTMLElement;
  const full = traces.map(() => 1);
  const fade = createHoverFade(
    (active) => {
      const opacity = traces.map((_, i) => (i === 0 || i === active ? 1 : 0.15));
      void Plotly.restyle(gd, { opacity } as unknown as Data);
    },
    () => {
      void Plotly.restyle(gd, { opacity: full } as unknown as Data);
    },
  );
  gd.on("plotly_hover", (evt) => {
    const active = evt.points[0]?.curveNumber;
    if (active === undefined || active === 0) return;
    fade.enter(active);
  });
  gd.on("plotly_unhover", () => {
    fade.leave();
  });
}
