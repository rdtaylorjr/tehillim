import { useCallback } from "react";
import styles from "../ModelDetail.module.css";
import { Card } from "./Card";
import { PlotMount } from "../PlotMount";
import type { PlotFn } from "../../charts/plot";
import { ScaledPlot } from "../ScaledPlot";
import { GapStat } from "../StatLine";
import { mountRainclouds } from "../../charts/rainclouds";
import { mountGenreMeanMatrix, mountHeatmap } from "../../charts/heatmap";
import { GENRE_COLORS, TOKENS } from "../../model/tokens";
import type { PsalmOrderEntry, RaincloudGroup, TrajectorySourceData } from "../../model/types";
import type { TrajectorySection as Section } from "../../model/types";

const GENRE_LIST = Object.keys(GENRE_COLORS);
const sourceColor = (key: string): string =>
  key === "different" ? TOKENS.trajAcross : TOKENS.trajWithin;

const SOURCES = [
  { key: "length_controlled", suffix: "length", heading: "Length-controlled" },
  {
    key: "length_and_content_controlled",
    suffix: "content",
    heading: "Length + content-controlled",
  },
] as const;

function SourceCharts({
  source,
  metric,
  order,
  suffix,
  heading,
  plot,
}: {
  readonly source: TrajectorySourceData;
  readonly metric: string;
  readonly order: PsalmOrderEntry[];
  readonly suffix: string;
  readonly heading: string;
  readonly plot?: PlotFn;
}): React.ReactElement {
  const drawRaincloud = useCallback(
    (el: HTMLElement) => {
      const groups: RaincloudGroup[] = [
        { ...source.raincloud.different, key: "different", label: "Across genre" },
        { ...source.raincloud.same, key: "combined", label: "Within genre" },
      ];
      mountRainclouds(el, groups, sourceColor, `${metric} (${suffix}-ctrl residual)`, plot);
    },
    [source.raincloud, metric, suffix, plot],
  );

  const drawMean = useCallback(
    (el: HTMLElement) => {
      mountGenreMeanMatrix(el, source.heatmap_genre_mean, GENRE_LIST, "residual", plot);
    },
    [source.heatmap_genre_mean, plot],
  );

  const drawFull = useCallback(
    (el: HTMLElement) => {
      mountHeatmap(el, source.heatmap, order, "residual", plot);
    },
    [source.heatmap, order, plot],
  );

  return (
    <>
      <Card
        title={`Residual distance by genre · ${heading}`}
        stat={<GapStat stats={source.gap_stats} />}
      >
        <PlotMount draw={drawRaincloud} />
      </Card>
      <Card title={`Pairwise distance by psalm · ${heading}`} wide>
        <div className={styles.heatmapPair}>
          <ScaledPlot draw={drawMean} />
          <ScaledPlot draw={drawFull} />
        </div>
      </Card>
    </>
  );
}

/** Within- against across-genre distance, for both controlled sources. */
export function TrajectorySection({
  section,
  plot,
}: {
  readonly section: Section;
  /** Injected in tests so a section renders without a real Plotly canvas. */
  readonly plot?: PlotFn;
}): React.ReactElement {
  return (
    <div className={styles.grid}>
      {SOURCES.map((s) => (
        <SourceCharts
          key={s.key}
          source={section.sources[s.key]}
          metric={section.metric}
          order={section.order}
          suffix={s.suffix}
          heading={s.heading}
          {...(plot === undefined ? {} : { plot })}
        />
      ))}
    </div>
  );
}
