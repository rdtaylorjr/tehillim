import { plotly } from "./plot";
import type { PlotFn } from "./plot";
import * as Plotly from "plotly.js-dist-min";
import type { Data } from "plotly.js";
import { TOKENS } from "../model/tokens";
import { raincloudRowLabel } from "../lib/raincloud";
import type { RaincloudGroup } from "../model/types";
import { baseLayout, PLOTLY_CONFIG } from "./baseLayout";

/** Mounts a raincloud plot (violin+box+points, or box+points below the density floor) into `mount`. */
export function mountRainclouds(
  mount: HTMLElement,
  groups: RaincloudGroup[],
  colorFn: (key: string) => string,
  xTitle: string,
  plot: PlotFn = plotly,
): void {
  const traces: Data[] = groups.map((g) => {
    const color = colorFn(g.key);
    const { thin, y0 } = raincloudRowLabel(g);
    if (thin) {
      return {
        type: "box",
        orientation: "h",
        y0,
        x: g.values,
        name: g.label,
        boxpoints: "all",
        jitter: 0.4,
        pointpos: 0,
        marker: { color, size: 3, opacity: 0.6 },
        line: { color, width: 1.5 },
        fillcolor: `${color}33`,
        hoverinfo: "x+name",
        hoveron: "points",
        showlegend: false,
      };
    }
    return {
      type: "violin",
      orientation: "h",
      y0,
      x: g.values,
      name: g.label,
      side: "negative",
      width: 0.78,
      box: { visible: true, width: 0.42 },
      meanline: { visible: true },
      points: "all",
      pointpos: 0.5,
      jitter: 0.3,
      marker: { color, size: 3, opacity: 0.45 },
      line: { color, width: 1.5 },
      fillcolor: `${color}55`,
      hoverinfo: "x+name",
      hoveron: "points",
      showlegend: false,
    };
  });

  const layout = baseLayout({
    xaxis: {
      title: { text: xTitle },
      zeroline: false,
      gridcolor: TOKENS.rule,
      tickfont: { family: TOKENS.mono, size: 10 },
    },
    yaxis: {
      automargin: true,
      tickfont: { family: TOKENS.mono, size: 10 },
      autorange: "reversed",
    },
    violinmode: "group",
    violingap: 0.1,
    height: Math.max(230, 92 * groups.length),
    margin: { l: 190, r: 20, t: 10, b: 50 },
  });

  void plot(mount, traces, layout, PLOTLY_CONFIG);
  const gd = mount as unknown as Plotly.PlotlyHTMLElement;
  const dimmed = traces.map(() => 0.15);
  const full = traces.map(() => 1);
  gd.on("plotly_hover", (evt) => {
    const active = evt.points[0]?.curveNumber;
    if (active === undefined) return;
    const opacity = traces.map((_, i) => (i === active ? 1 : dimmed[i]));
    void Plotly.restyle(gd, { opacity } as unknown as Data);
  });
  gd.on("plotly_unhover", () => {
    void Plotly.restyle(gd, { opacity: full } as unknown as Data);
  });
}
