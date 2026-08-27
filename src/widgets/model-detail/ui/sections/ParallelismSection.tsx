import { useCallback } from "react";
import styles from "../ModelDetail.module.css";
import { Card } from "./Card";
import { SeriesKey } from "../SeriesKey";
import { PlotMount } from "../PlotMount";
import { mountMultiCurve } from "../../charts/curves";
import { mountRainclouds } from "../../charts/rainclouds";
import { orderGroups, seriesColor } from "../../lib/curveStyle";
import { computePrevalence } from "../../lib/prevalence";
import { ScalarStat } from "../StatLine";
import { PARALLELISM_TYPE_COLORS, TOKENS } from "../../model/tokens";
import type { ParallelismSection as Section } from "../../model/types";

const groupColor = (key: string): string => {
  if (key === "baseline") return TOKENS.inkFaint;
  if (key === "combined") return TOKENS.accent;
  return PARALLELISM_TYPE_COLORS[key] ?? TOKENS.inkDim;
};

/** Marked-parallel against baseline: the discrimination claim, then the scores behind it. */
export function ParallelismSection({
  section,
}: {
  readonly section: Section;
}): React.ReactElement {
  const curveColor = useCallback(
    (name: string): string =>
      seriesColor(name, PARALLELISM_TYPE_COLORS, TOKENS.accent, TOKENS.inkFaint),
    [],
  );

  const combined = section.series.find((s) => s.name === "Combined") ?? section.series[0];
  const baseline = section.raincloud_groups.find((g) => g.key === "baseline");
  const prevalence = computePrevalence(combined?.n ?? 0, baseline?.n ?? 0);

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
        <Card title="Calibrated score by pair type" wide>
          <PlotMount draw={drawRaincloud} />
        </Card>
      </div>
    </>
  );
}
