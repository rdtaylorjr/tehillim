import * as d3 from "d3";
import { computeAlluvialLayout, type AlluvialLayout } from "../lib/alluvial";
import { orderClustersByGenre } from "../lib/clusterColumnOrder";
import type { SelectedAlignmentCell } from "../lib/alignmentCell";
import type { GenreAlignment } from "../types";

export interface AlluvialDiagram {
  destroy(): void;
}

const NODE_WIDTH = 12;
const LABEL_GAP = 8;
const LABEL_COLUMN = 190;
const NODE_GAP = 3;
const TOP_PADDING = 8;
const CLUSTER_FILL = "#a89a8a";

/**
 * Genre -> cluster alluvial diagram: ribbon width is the shared psalm
 * count, read left to right. This is the primary view for "does this
 * signal recover Gunkel's genres" - a genre that lands mostly in one
 * cluster shows as one thick ribbon; a genre spread across many clusters
 * shows as several thin ones. That comparison is the entire content of the
 * old shaded contingency table, but it used to require reading numbers and
 * a shading legend to make - here it's the geometry itself.
 *
 * Ribbons are tinted by their *source* genre's own reference color (the
 * same Gunkel family/genre scale already driving the picker and the
 * scatter plot - see lib/referenceColor.ts), so this chart never
 * introduces a second, competing color meaning. Cluster nodes stay a
 * fixed neutral tone, same as the scatter plot's hulls: cluster identity
 * is shown structurally (which node a ribbon ends at), never by color.
 */
export function renderAlluvialDiagram(
  container: HTMLElement,
  alignment: GenreAlignment,
  genreColorOf: (genre: string) => string,
  selected: SelectedAlignmentCell | null,
): AlluvialDiagram {
  container.innerHTML = "";

  const columnOrder = orderClustersByGenre(alignment.clusterGenreLabels, alignment.genres);
  const targetLabels = columnOrder.map((clusterIndex) => `Cluster ${clusterIndex + 1}`);
  const counts = alignment.counts.map((row) => columnOrder.map((clusterIndex) => row[clusterIndex]));

  const svg = d3.select(container).append("svg").attr("class", "alluvial-svg");
  const genreLabelLayer = svg.append("g").attr("class", "alluvial-genre-labels");
  const ribbonLayer = svg.append("g").attr("class", "alluvial-ribbons");
  const nodeLayer = svg.append("g").attr("class", "alluvial-nodes");
  const clusterLabelLayer = svg.append("g").attr("class", "alluvial-cluster-labels");

  function render(): void {
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    svg.attr("viewBox", [0, 0, width, height]);

    const plotHeight = Math.max(height - TOP_PADDING * 2, 1);
    const leftX = LABEL_COLUMN;
    const rightX = width - LABEL_COLUMN;

    const layout: AlluvialLayout = computeAlluvialLayout(
      { sourceLabels: alignment.genres, targetLabels, counts },
      plotHeight,
      NODE_GAP,
    );

    const selectedGenreIndex =
      selected !== null ? alignment.genres.indexOf(selected.category) : -1;
    const selectedTargetIndex = selected !== null ? columnOrder.indexOf(selected.cluster) : -1;

    const ribbonPath = (
      sourceY0: number,
      sourceY1: number,
      targetY0: number,
      targetY1: number,
    ): string => {
      const midX = (leftX + NODE_WIDTH + rightX) / 2;
      const y0 = sourceY0 + TOP_PADDING;
      const y1 = sourceY1 + TOP_PADDING;
      const y2 = targetY0 + TOP_PADDING;
      const y3 = targetY1 + TOP_PADDING;
      const x0 = leftX + NODE_WIDTH;
      return `M${x0},${y0} C${midX},${y0} ${midX},${y2} ${rightX},${y2} L${rightX},${y3} C${midX},${y3} ${midX},${y1} ${x0},${y1} Z`;
    };

    ribbonLayer
      .selectAll<SVGPathElement, AlluvialLayout["links"][number]>("path")
      .data(layout.links, (l) => `${l.sourceIndex}-${l.targetIndex}`)
      .join("path")
      .attr("class", "alluvial-ribbon")
      .attr("d", (l) => ribbonPath(l.sourceY0, l.sourceY1, l.targetY0, l.targetY1))
      .attr("fill", (l) => genreColorOf(alignment.genres[l.sourceIndex]))
      .classed(
        "is-selected",
        (l) => l.sourceIndex === selectedGenreIndex && l.targetIndex === selectedTargetIndex,
      )
      .append("title")
      .text(
        (l) =>
          `${l.value} of ${alignment.genres[l.sourceIndex]} psalms in ${targetLabels[l.targetIndex]}`,
      );

    const sourceNodes = nodeLayer
      .selectAll<SVGRectElement, (typeof layout.sourceNodes)[number]>("rect.alluvial-source-node")
      .data(layout.sourceNodes, (_, i) => `s${i}`)
      .join("rect")
      .attr("class", "alluvial-source-node")
      .attr("x", leftX)
      .attr("y", (n) => n.y0 + TOP_PADDING)
      .attr("width", NODE_WIDTH)
      .attr("height", (n) => Math.max(n.y1 - n.y0, 0))
      .attr("fill", (n) => genreColorOf(n.label));
    sourceNodes.selectAll("title").remove();
    sourceNodes.append("title").text((n) => `${n.label}: ${n.value} psalms`);

    const targetNodes = nodeLayer
      .selectAll<SVGRectElement, (typeof layout.targetNodes)[number]>("rect.alluvial-target-node")
      .data(layout.targetNodes, (_, i) => `t${i}`)
      .join("rect")
      .attr("class", "alluvial-target-node")
      .attr("x", rightX)
      .attr("y", (n) => n.y0 + TOP_PADDING)
      .attr("width", NODE_WIDTH)
      .attr("height", (n) => Math.max(n.y1 - n.y0, 0))
      .attr("fill", CLUSTER_FILL);
    targetNodes.selectAll("title").remove();
    targetNodes.append("title").text((n, i) => {
      const match = alignment.clusterGenreLabels[columnOrder[i]];
      return match ? `${n.label}: ${n.value} psalms - best match: ${match}` : `${n.label}: ${n.value} psalms - no strong match`;
    });

    genreLabelLayer
      .selectAll<SVGTextElement, (typeof layout.sourceNodes)[number]>("text")
      .data(layout.sourceNodes, (_, i) => `s${i}`)
      .join("text")
      .attr("class", "alluvial-label alluvial-label-source")
      .attr("x", leftX - LABEL_GAP)
      .attr("y", (n) => (n.y0 + n.y1) / 2 + TOP_PADDING)
      .attr("dominant-baseline", "middle")
      .style("display", (n) => (n.value > 0 ? null : "none"))
      .text((n) => `${n.label} (${n.value})`);

    clusterLabelLayer
      .selectAll<SVGTextElement, (typeof layout.targetNodes)[number]>("text")
      .data(layout.targetNodes, (_, i) => `t${i}`)
      .join("text")
      .attr("class", "alluvial-label alluvial-label-target")
      .attr("x", rightX + NODE_WIDTH + LABEL_GAP)
      .attr("y", (n) => (n.y0 + n.y1) / 2 + TOP_PADDING)
      .attr("dominant-baseline", "middle")
      .style("display", (n) => (n.value > 0 ? null : "none"))
      .text((n) => `${n.label} (${n.value})`);

    // Hovering a node (genre or cluster) dims every ribbon not touching
    // it - with up to 14 genres and 10 clusters, ribbons cross each other
    // enough that tracing one by eye alone is unreliable.
    const allRibbons = ribbonLayer.selectAll<SVGPathElement, AlluvialLayout["links"][number]>("path");
    const clearHighlight = (): void => {
      allRibbons.classed("is-dim", false);
    };
    sourceNodes
      .on("mouseenter", (_event, n) => {
        const i = layout.sourceNodes.indexOf(n);
        allRibbons.classed("is-dim", (l) => l.sourceIndex !== i);
      })
      .on("mouseleave", clearHighlight);
    targetNodes
      .on("mouseenter", (_event, n) => {
        const j = layout.targetNodes.indexOf(n);
        allRibbons.classed("is-dim", (l) => l.targetIndex !== j);
      })
      .on("mouseleave", clearHighlight);
  }

  const resizeObserver = new ResizeObserver(() => render());
  resizeObserver.observe(container);
  render();

  return {
    destroy(): void {
      resizeObserver.disconnect();
    },
  };
}
