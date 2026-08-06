import * as d3 from "d3";
import type { ReferenceColoring } from "../lib/referenceColor";
import {
  buildPoints,
  isBackgroundClick,
  isHullDimmed,
  isPointDimmed,
  selectedCluster,
  type Point,
} from "../lib/scatterPlot";
import type { ClusterMethodPayload, PsalmCore } from "../types";

export interface ScatterPlot {
  setSelected(psalm: number | null): void;
  destroy(): void;
}

const PADDING = 24;

/**
 * A 2D classical-MDS layout of this signal's similarity matrix (see
 * pipeline/embedding.py): psalms that this signal treats as similar sit
 * close together, regardless of cluster or category. Point fill is always
 * the shared reference coloring (Book / Gunkel family / Gunkel genre) -
 * never cluster assignment - so this plot answers "does color group into
 * neighborhoods?" honestly. Cluster membership is drawn structurally
 * instead: a translucent, neutral convex hull traced around each cluster's
 * points (clusters under 3 points get a dashed ring around their
 * centroid, since a hull needs 3+ points), each labeled with its cluster
 * number at the hull's centroid.
 */
export function renderScatterPlot(
  container: HTMLElement,
  psalms: PsalmCore[],
  method: ClusterMethodPayload,
  coloring: ReferenceColoring,
  onSelect: (psalm: number) => void,
  onDeselect: () => void,
): ScatterPlot {
  container.innerHTML = "";

  const points = buildPoints(psalms, method);

  const svg = d3.select(container).append("svg").attr("class", "scatter-svg");
  const zoomLayer = svg.append("g");
  const hullLayer = zoomLayer.append("g").attr("class", "scatter-hull-layer");
  const pointLayer = zoomLayer.append("g").attr("class", "scatter-point-layer");

  svg.call(
    d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        zoomLayer.attr("transform", event.transform.toString());
      }),
  );

  // Clicking anywhere that isn't a point clears the selection - hulls are
  // pointer-events: none (see style.css) so a click "inside" a hull's
  // shaded region still counts as background, not as picking that
  // cluster. Checking the event target (not just bubbling) is what keeps
  // this from also firing when a point's own click handler already ran.
  svg.on("click", (event: MouseEvent) => {
    if (isBackgroundClick(event.target, svg.node())) onDeselect();
  });

  const pointByPsalm = new Map(points.map((p) => [p.psalm, p]));
  let selected: number | null = null;

  function render(): void {
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    svg.attr("viewBox", [0, 0, width, height]);

    const xExtent = d3.extent(points, (p) => p.x) as [number, number];
    const yExtent = d3.extent(points, (p) => p.y) as [number, number];
    const xScale = d3
      .scaleLinear()
      .domain(xExtent[0] === xExtent[1] ? [xExtent[0] - 1, xExtent[0] + 1] : xExtent)
      .range([PADDING, width - PADDING]);
    const yScale = d3
      .scaleLinear()
      .domain(yExtent[0] === yExtent[1] ? [yExtent[0] - 1, yExtent[0] + 1] : yExtent)
      .range([height - PADDING, PADDING]);

    const byCluster = d3.group(points, (p) => p.cluster);

    hullLayer
      .selectAll<SVGGElement, [number, Point[]]>("g")
      .data([...byCluster.entries()], ([cluster]) => cluster)
      .join("g")
      .attr("class", "scatter-hull")
      .each(function ([cluster, members]) {
        const group = d3.select(this);
        group.selectAll("*").remove();
        const screenPoints: [number, number][] = members.map((p) => [xScale(p.x), yScale(p.y)]);
        const hull = d3.polygonHull(screenPoints);
        const centroid = d3.polygonCentroid(
          hull ?? (screenPoints.length > 0 ? [...screenPoints, screenPoints[0]] : [[0, 0]]),
        );

        if (hull) {
          group
            .append("path")
            .attr("class", "scatter-hull-path")
            .attr("d", `M${hull.map((p) => p.join(",")).join("L")}Z`);
        } else {
          const radius = 16;
          group
            .append("circle")
            .attr("class", "scatter-hull-ring")
            .attr("cx", centroid[0])
            .attr("cy", centroid[1])
            .attr("r", radius);
        }

        group
          .append("text")
          .attr("class", "scatter-hull-label")
          .attr("x", centroid[0])
          .attr("y", centroid[1])
          .text(`C${cluster + 1}`);
      });

    const circles = pointLayer
      .selectAll<SVGCircleElement, Point>("circle")
      .data(points, (p) => p.psalm)
      .join("circle")
      .attr("class", "scatter-point")
      .attr("r", 5)
      .attr("cx", (p) => xScale(p.x))
      .attr("cy", (p) => yScale(p.y))
      .attr("fill", (p) => coloring.colorOf(p.psalm))
      .on("click", (_event, p) => onSelect(p.psalm));
    circles.selectAll("title").remove();
    circles.append("title").text((p) => `Psalm ${p.psalm} — Cluster ${p.cluster + 1}`);

    applySelectionStyle();
  }

  function applySelectionStyle(): void {
    const selectedClusterId = selectedCluster(pointByPsalm, selected);
    // Mirrors NetworkGraph's dim-the-rest treatment on selection, but the
    // "neighbors" here are "same-cluster points" rather than edge-connected
    // nodes - dimming everyone outside the selected point's cluster makes
    // that cluster's hull and membership pop out at a glance.
    pointLayer
      .selectAll<SVGCircleElement, Point>("circle")
      .classed("is-selected", (p) => p.psalm === selected)
      .classed("is-dim", (p) => isPointDimmed(p, selected, selectedClusterId));

    hullLayer
      .selectAll<SVGGElement, [number, Point[]]>(".scatter-hull")
      .classed("is-dim", ([cluster]) => isHullDimmed(cluster, selectedClusterId));
  }

  const resizeObserver = new ResizeObserver(() => render());
  resizeObserver.observe(container);
  render();

  return {
    setSelected(psalm: number | null): void {
      selected = psalm;
      applySelectionStyle();
    },
    destroy(): void {
      resizeObserver.disconnect();
    },
  };
}
