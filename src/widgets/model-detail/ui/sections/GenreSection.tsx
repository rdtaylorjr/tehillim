import { useCallback } from "react";
import styles from "../ModelDetail.module.css";
import { Card } from "./Card";
import { SeriesKey } from "../SeriesKey";
import { PlotMount } from "../PlotMount";
import { ScaledPlot } from "../ScaledPlot";
import { ScalarStat } from "../StatLine";
import { mountMultiCurve } from "../../charts/curves";
import { mountRainclouds } from "../../charts/rainclouds";
import { mountGenreMeanMatrix, mountHeatmap } from "../../charts/heatmap";
import { orderGroups, seriesColor } from "../../lib/curveStyle";
import { computePrevalence } from "../../lib/prevalence";
import { GENRE_COLORS, TOKENS } from "../../model/tokens";
import type { GenreSection as Section } from "../../model/types";

const GENRE_LIST = Object.keys(GENRE_COLORS);

const groupColor = (key: string): string => {
  if (key === "different") return TOKENS.inkFaint;
  if (key === "combined") return TOKENS.accent;
  return GENRE_COLORS[key] ?? TOKENS.inkDim;
};

/** Same- against different-genre separation, then the full pairwise structure behind it. */
export function GenreSection({ section }: { readonly section: Section }): React.ReactElement {
  const curveColor = useCallback(
    (name: string): string => seriesColor(name, GENRE_COLORS, TOKENS.accent, TOKENS.inkFaint),
    [],
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
      );
    },
    [section.series, curveColor],
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
      );
    },
    [section.series, curveColor, prevalence],
  );

  const drawRaincloud = useCallback(
    (el: HTMLElement) => {
      const groups = orderGroups(
        section.raincloud_groups,
        section.series.map((s) => s.name),
      );
      mountRainclouds(el, groups, groupColor, "calibrated_z");
    },
    [section.raincloud_groups, section.series],
  );

  const drawMean = useCallback(
    (el: HTMLElement) => {
      mountGenreMeanMatrix(el, section.heatmap_genre_mean, GENRE_LIST, "calibrated_z");
    },
    [section.heatmap_genre_mean],
  );

  const drawFull = useCallback(
    (el: HTMLElement) => {
      mountHeatmap(el, section.heatmap, section.genre_order, "calibrated_z");
    },
    [section.heatmap, section.genre_order],
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
        <Card title="Calibrated score by genre" wide>
          <PlotMount draw={drawRaincloud} />
        </Card>
        <Card title="Pairwise similarity by psalm" wide>
          <div className={styles.heatmapPair}>
            <ScaledPlot draw={drawMean} />
            <ScaledPlot draw={drawFull} />
          </div>
        </Card>
      </div>
    </>
  );
}
