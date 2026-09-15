import { useCallback } from "react";
import styles from "../ModelDetail.module.css";
import { Card } from "./Card";
import { PlotMount } from "../../../../shared/ui";
import { GENRE_COLORS, TOKENS } from "../../../../shared/charts";
import type { PlotFn } from "../../../../shared/charts";
import { ScaledPlot } from "../ScaledPlot";
import { GapStat } from "../StatLine";
import { mountRainclouds } from "../../charts/rainclouds";
import { mountGenreMeanMatrix, mountHeatmap } from "../../charts/heatmap";
import { controlLabel } from "../../../../shared/lib/corpus";
import type { TrajectoryControl } from "../../../../shared/lib/corpus";
import type { RaincloudGroup } from "../../model/types";
import type { TrajectorySection as Section } from "../../model/types";

const GENRE_LIST = Object.keys(GENRE_COLORS);
const sourceColor = (key: string): string =>
  key === "different" ? TOKENS.trajAcross : TOKENS.trajWithin;

/** Within- against across-genre distance, net of the chosen control. */
export function TrajectorySection({
  section,
  control,
  plot,
}: {
  readonly section: Section;
  readonly control: TrajectoryControl;
  /** Injected in tests so a section renders without a real Plotly canvas. */
  readonly plot?: PlotFn;
}): React.ReactElement {
  const source = section.sources[control];
  const { metric, order } = section;
  const heading = controlLabel(control);
  const drawRaincloud = useCallback(
    (el: HTMLElement) => {
      const groups: RaincloudGroup[] = [
        { ...source.raincloud.different, key: "different", label: "Across genre" },
        { ...source.raincloud.same, key: "combined", label: "Within genre" },
      ];
      mountRainclouds(el, groups, sourceColor, `${metric} (${heading} residual)`, plot);
    },
    [source.raincloud, metric, heading, plot],
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
    <div className={styles.grid}>
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
    </div>
  );
}
