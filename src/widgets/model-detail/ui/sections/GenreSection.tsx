import { useCallback, useMemo } from "react";
import styles from "../ModelDetail.module.css";
import { Card } from "./Card";
import { SeriesKey } from "../SeriesKey";
import { PlotMount } from "../../../../shared/ui";
import { TOKENS, genreColors } from "../../../../shared/charts";
import type { PlotFn } from "../../../../shared/charts";
import { ScaledPlot } from "../ScaledPlot";
import { ScalarStat } from "../StatLine";
import { mountMultiCurve } from "../../charts/curves";
import { mountRainclouds } from "../../charts/rainclouds";
import { mountGenreMeanMatrix, mountHeatmap } from "../../charts/heatmap";
import { orderGroups, seriesColor } from "../../lib/curveStyle";
import { passageAxis } from "../../lib/pairAxis";
import { computePrevalence } from "../../lib/prevalence";
import type { GenreSection as Section } from "../../model/types";

/** Same- against different-class separation, then the full pairwise structure behind it. */
export function GenreSection({
  section,
  genres,
  category,
  itemName,
  plot,
}: {
  readonly section: Section;
  /** The register's classes in the order its matrices read them, each keeping one colour. */
  readonly genres: readonly string[];
  /** The register's word for a class, Genre or Gattung, in lower case for the headings. */
  readonly category: string;
  /** What the register's items are, psalm or passage, for the matrix heading. */
  readonly itemName: string;
  /** Injected in tests so a section renders without a real Plotly canvas. */
  readonly plot?: PlotFn;
}): React.ReactElement {
  const palette = useMemo(() => genreColors(genres), [genres]);
  const curveColor = useCallback(
    (name: string): string => seriesColor(name, palette, TOKENS.ink, TOKENS.inkFaint),
    [palette],
  );
  const groupColor = useCallback(
    (key: string): string => {
      if (key === "different") return TOKENS.inkFaint;
      if (key === "combined") return TOKENS.ink;
      return palette[key] ?? TOKENS.inkDim;
    },
    [palette],
  );

  const drawRoc = useCallback(
    (el: HTMLElement) => {
      mountMultiCurve(
        el,
        section.series,
        "roc",
        "fpr",
        "tpr",
        "False positive rate",
        "True positive rate",
        curveColor,
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        false,
        plot,
      );
    },
    [section.series, curveColor, plot],
  );

  // The PR chance line is the positive-class prevalence, not the achieved AP.
  const combined = section.series.find((s) => s.name === "Combined") ?? section.series[0];
  const different = section.raincloud_groups.find((g) => g.key === "different");
  const prevalence = computePrevalence(combined?.n ?? 0, different?.n ?? 0);

  const drawPr = useCallback(
    (el: HTMLElement) => {
      mountMultiCurve(
        el,
        section.series,
        "pr",
        "recall",
        "precision",
        "Recall",
        "Precision",
        curveColor,
        [
          { x: 0, y: prevalence },
          { x: 1, y: prevalence },
        ],
        false,
        plot,
      );
    },
    [section.series, curveColor, prevalence, plot],
  );

  const drawRaincloud = useCallback(
    (el: HTMLElement) => {
      const groups = orderGroups(
        section.raincloud_groups,
        section.series.map((s) => s.name),
      );
      mountRainclouds(el, groups, groupColor, "calibrated_z", plot);
    },
    [section.raincloud_groups, section.series, groupColor, plot],
  );

  const drawMean = useCallback(
    (el: HTMLElement) => {
      mountGenreMeanMatrix(el, section.heatmap_genre_mean, [...genres], "calibrated_z", plot);
    },
    [section.heatmap_genre_mean, genres, plot],
  );

  const drawFull = useCallback(
    (el: HTMLElement) => {
      const axis = passageAxis(section.genre_order, section.heatmap);
      mountHeatmap(el, axis.cells, axis.order, "calibrated_z", plot);
    },
    [section.heatmap, section.genre_order, plot],
  );

  const stats = section.auc_ap_stats;
  return (
    <>
      <SeriesKey names={section.series.map((s) => s.name)} color={curveColor} />
      <div className={styles.grid}>
        <Card
          title="ROC curve"
          stat={
            <ScalarStat
              label="auc"
              point={stats.auc}
              ciLow={stats.auc_ci_low}
              ciHigh={stats.auc_ci_high}
            />
          }
        >
          <PlotMount draw={drawRoc} />
        </Card>
        <Card
          title="Precision–Recall curve"
          stat={
            <ScalarStat
              label="ap"
              point={stats.ap}
              ciLow={stats.ap_ci_low}
              ciHigh={stats.ap_ci_high}
            />
          }
        >
          <PlotMount draw={drawPr} />
        </Card>
        <Card title={`Calibrated score by ${category.toLowerCase()}`} wide>
          <PlotMount draw={drawRaincloud} />
        </Card>
        <Card title={`Pairwise similarity by ${itemName}`} wide>
          <div className={styles.heatmapPair}>
            <ScaledPlot draw={drawMean} />
            <ScaledPlot draw={drawFull} />
          </div>
        </Card>
      </div>
    </>
  );
}
