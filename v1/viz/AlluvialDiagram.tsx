import { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "./AlluvialDiagram.module.css";
import { computeAlluvialLayout } from "../lib/alluvial";
import type { AlluvialLayout } from "../lib/alluvial";
import { orderClustersByGenre } from "../lib/clusterColumnOrder";
import type { SelectedAlignmentCell } from "../lib/alignmentCell";
import type { GenreAlignment } from "../model/types";

const NODE_WIDTH = 12;
const LABEL_GAP = 8;
const LABEL_COLUMN = 190;
const MIN_LABEL_COLUMN = 60;
const NODE_GAP = 3;
const TOP_PADDING = 8;
/** Cluster identity is never a color, so every cluster node takes one neutral. */
const CLUSTER_FILL = "#6b6f76";

export interface AlluvialDiagramProps {
  readonly alignment: GenreAlignment;
  readonly genreColorOf: (genre: string) => string;
  readonly selected: SelectedAlignmentCell | null;
}

/**
 * Genre -> cluster alluvial diagram: ribbon width is the shared psalm count,
 * read left to right. This is the primary view for "does this signal recover
 * Gunkel's genres" - a genre that lands mostly in one cluster shows as one
 * thick ribbon; a genre spread across many clusters shows as several thin ones.
 * That comparison is the entire content of the exact-counts table below, but
 * there it takes reading numbers and a shading legend; here it is the geometry.
 *
 * Ribbons are tinted by their *source* genre's own reference color (the same
 * Gunkel scale driving the picker and the scatter plot), so this chart never
 * introduces a second, competing color meaning. Cluster nodes stay a fixed
 * neutral, same as the scatter plot's hulls.
 */
export function AlluvialDiagram({
  alignment,
  genreColorOf,
  selected,
}: AlluvialDiagramProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    container.innerHTML = "";

    const columnOrder = orderClustersByGenre(alignment.clusterGenreLabels, alignment.genres);
    const targetLabels = columnOrder.map((index) => `Cluster ${String(index + 1)}`);
    const counts = alignment.counts.map((row) => columnOrder.map((index) => row[index] ?? 0));

    const svg = d3.select(container).append("svg").attr("class", styles.alluvialSvg);
    const genreLabelLayer = svg.append("g");
    const ribbonLayer = svg.append("g");
    const nodeLayer = svg.append("g");
    const clusterLabelLayer = svg.append("g");

    const render = (): void => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      svg.attr("viewBox", [0, 0, width, height].join(" "));

      const plotHeight = Math.max(height - TOP_PADDING * 2, 1);
      // On narrow containers a fixed label column on each side would exceed the
      // available width outright and invert the plot area, so it scales down
      // with the container instead of staying fixed.
      const labelColumn = Math.max(Math.min(LABEL_COLUMN, width * 0.28), MIN_LABEL_COLUMN);
      const leftX = labelColumn;
      const rightX = width - labelColumn;

      const layout: AlluvialLayout = computeAlluvialLayout(
        { sourceLabels: alignment.genres, targetLabels, counts },
        plotHeight,
        NODE_GAP,
      );

      const selectedGenreIndex = selected ? alignment.genres.indexOf(selected.category) : -1;
      const selectedTargetIndex = selected ? columnOrder.indexOf(selected.cluster) : -1;

      const ribbonPath = (l: AlluvialLayout["links"][number]): string => {
        const midX = (leftX + NODE_WIDTH + rightX) / 2;
        const y0 = l.sourceY0 + TOP_PADDING;
        const y1 = l.sourceY1 + TOP_PADDING;
        const y2 = l.targetY0 + TOP_PADDING;
        const y3 = l.targetY1 + TOP_PADDING;
        const x0 = leftX + NODE_WIDTH;
        return `M${String(x0)},${String(y0)} C${String(midX)},${String(y0)} ${String(midX)},${String(y2)} ${String(rightX)},${String(y2)} L${String(rightX)},${String(y3)} C${String(midX)},${String(y3)} ${String(midX)},${String(y1)} ${String(x0)},${String(y1)} Z`;
      };

      const ribbons = ribbonLayer
        .selectAll<SVGPathElement, AlluvialLayout["links"][number]>("path")
        .data(layout.links, (l) => `${String(l.sourceIndex)}-${String(l.targetIndex)}`)
        .join("path")
        .attr("class", styles.alluvialRibbon)
        .attr("d", ribbonPath)
        .attr("fill", (l) => genreColorOf(alignment.genres[l.sourceIndex] ?? ""))
        .classed(
          styles.isSelected,
          (l) => l.sourceIndex === selectedGenreIndex && l.targetIndex === selectedTargetIndex,
        );
      ribbons.selectAll("title").remove();
      ribbons
        .append("title")
        .text(
          (l) =>
            `${String(l.value)} of ${alignment.genres[l.sourceIndex] ?? ""} psalms in ${targetLabels[l.targetIndex] ?? ""}`,
        );

      const sourceNodes = nodeLayer
        .selectAll<SVGRectElement, AlluvialLayout["sourceNodes"][number]>("rect.source")
        .data(layout.sourceNodes, (n) => `s${n.label}`)
        .join("rect")
        .attr("class", `source ${styles.alluvialNode}`)
        .attr("x", leftX)
        .attr("y", (n) => n.y0 + TOP_PADDING)
        .attr("width", NODE_WIDTH)
        .attr("height", (n) => Math.max(n.y1 - n.y0, 0))
        .attr("fill", (n) => genreColorOf(n.label));
      sourceNodes.selectAll("title").remove();
      sourceNodes.append("title").text((n) => `${n.label}: ${String(n.value)} psalms`);

      const targetNodes = nodeLayer
        .selectAll<SVGRectElement, AlluvialLayout["targetNodes"][number]>("rect.target")
        .data(layout.targetNodes, (n) => `t${n.label}`)
        .join("rect")
        .attr("class", `target ${styles.alluvialNode}`)
        .attr("x", rightX)
        .attr("y", (n) => n.y0 + TOP_PADDING)
        .attr("width", NODE_WIDTH)
        .attr("height", (n) => Math.max(n.y1 - n.y0, 0))
        .attr("fill", CLUSTER_FILL);
      targetNodes.selectAll("title").remove();
      targetNodes.append("title").text((n, i) => {
        const clusterIndex = columnOrder[i];
        const match =
          clusterIndex === undefined
            ? null
            : (alignment.clusterGenreLabels[clusterIndex] ?? null);
        return match
          ? `${n.label}: ${String(n.value)} psalms. Best match: ${match}`
          : `${n.label}: ${String(n.value)} psalms. No strong match`;
      });

      genreLabelLayer
        .selectAll<SVGTextElement, AlluvialLayout["sourceNodes"][number]>("text")
        .data(layout.sourceNodes, (n) => `s${n.label}`)
        .join("text")
        .attr("class", `${styles.alluvialLabel} ${styles.alluvialLabelSource}`)
        .attr("x", leftX - LABEL_GAP)
        .attr("y", (n) => (n.y0 + n.y1) / 2 + TOP_PADDING)
        .attr("dominant-baseline", "middle")
        .style("display", (n) => (n.value > 0 ? null : "none"))
        .text((n) => `${n.label} (${String(n.value)})`);

      clusterLabelLayer
        .selectAll<SVGTextElement, AlluvialLayout["targetNodes"][number]>("text")
        .data(layout.targetNodes, (n) => `t${n.label}`)
        .join("text")
        .attr("class", `${styles.alluvialLabel} ${styles.alluvialLabelTarget}`)
        .attr("x", rightX + NODE_WIDTH + LABEL_GAP)
        .attr("y", (n) => (n.y0 + n.y1) / 2 + TOP_PADDING)
        .attr("dominant-baseline", "middle")
        .style("display", (n) => (n.value > 0 ? null : "none"))
        .text((n) => `${n.label} (${String(n.value)})`);

      // Hovering a node dims every ribbon not touching it - with up to 14
      // genres and 10 clusters, ribbons cross each other enough that tracing
      // one by eye alone is unreliable.
      const clearHighlight = (): void => {
        ribbons.classed(styles.isDim, false);
      };
      sourceNodes
        .on("mouseenter", (_event, n) => {
          const i = layout.sourceNodes.indexOf(n);
          ribbons.classed(styles.isDim, (l) => l.sourceIndex !== i);
        })
        .on("mouseleave", clearHighlight);
      targetNodes
        .on("mouseenter", (_event, n) => {
          const j = layout.targetNodes.indexOf(n);
          ribbons.classed(styles.isDim, (l) => l.targetIndex !== j);
        })
        .on("mouseleave", clearHighlight);
    };

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(container);
    render();

    return () => {
      resizeObserver.disconnect();
      container.innerHTML = "";
    };
  }, [alignment, genreColorOf, selected]);

  return <div className={styles.alluvialContainer} ref={containerRef} />;
}
