import { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "./ScatterPlot.module.css";
import {
  buildPoints,
  degenerateHullCentroid,
  isBackgroundClick,
  isHullDimmed,
  isPointDimmed,
  selectedCluster,
} from "../lib/scatterPlot";
import type { Point } from "../lib/scatterPlot";
import type { ReferenceColoring } from "../lib/referenceColor";
import type { ClusterMethodPayload, PsalmCore } from "../model/types";

const PADDING = 24;

export interface ScatterPlotProps {
  readonly psalms: readonly PsalmCore[];
  readonly method: ClusterMethodPayload;
  readonly coloring: ReferenceColoring;
  readonly selected: number | null;
  readonly lowConfidence: boolean;
  readonly onSelect: (psalm: number) => void;
  readonly onDeselect: () => void;
}

/**
 * A 2D spectral layout of this signal's similarity matrix: psalms the signal
 * treats as similar sit close together, regardless of cluster or category.
 * Point fill is always the shared reference coloring (Book / Gunkel family /
 * Gunkel genre) - never cluster assignment - so this plot answers "does color
 * group into neighborhoods?" honestly. Cluster membership is drawn structurally
 * instead: a translucent, neutral convex hull traced around each cluster's
 * points (clusters under 3 points get a dashed ring around their centroid,
 * since a hull needs 3+ points), each labeled at the hull's centroid.
 */
export function ScatterPlot({
  psalms,
  method,
  coloring,
  selected,
  lowConfidence,
  onSelect,
  onDeselect,
}: ScatterPlotProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const applyRef = useRef<((psalm: number | null) => void) | null>(null);
  const handlers = useRef({ onSelect, onDeselect });
  useEffect(() => {
    handlers.current = { onSelect, onDeselect };
  }, [onDeselect, onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    container.innerHTML = "";

    const points = buildPoints([...psalms], method);
    const pointByPsalm = new Map(points.map((p) => [p.psalm, p]));
    let current: number | null = null;

    const svg = d3.select(container).append("svg").attr("class", styles.scatterSvg);
    const zoomLayer = svg.append("g");
    const hullLayer = zoomLayer.append("g");
    const pointLayer = zoomLayer.append("g");

    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          zoomLayer.attr("transform", event.transform.toString());
        }),
    );

    // Clicking anywhere that isn't a point clears the selection - hulls are
    // pointer-events: none so a click "inside" a hull's shaded region still
    // counts as background, not as picking that cluster.
    svg.on("click", (event: MouseEvent) => {
      if (isBackgroundClick(event.target, svg.node())) handlers.current.onDeselect();
    });

    const applySelectionStyle = (): void => {
      const selectedClusterId = selectedCluster(pointByPsalm, current);
      pointLayer
        .selectAll<SVGCircleElement, Point>("circle")
        .classed(styles.isSelected, (p) => p.psalm === current)
        .classed(styles.isDim, (p) => isPointDimmed(p, current, selectedClusterId));
      hullLayer
        .selectAll<SVGGElement, [number, Point[]]>("g")
        .classed(styles.isDim, ([cluster]) => isHullDimmed(cluster, selectedClusterId));
    };
    applyRef.current = (psalm) => {
      current = psalm;
      applySelectionStyle();
    };

    const render = (): void => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      svg.attr("viewBox", [0, 0, width, height].join(" "));

      const xExtent = d3.extent(points, (p) => p.x);
      const yExtent = d3.extent(points, (p) => p.y);
      const xDomain: [number, number] =
        xExtent[0] === undefined || xExtent[0] === xExtent[1]
          ? [(xExtent[0] ?? 0) - 1, (xExtent[0] ?? 0) + 1]
          : [xExtent[0], xExtent[1]];
      const yDomain: [number, number] =
        yExtent[0] === undefined || yExtent[0] === yExtent[1]
          ? [(yExtent[0] ?? 0) - 1, (yExtent[0] ?? 0) + 1]
          : [yExtent[0], yExtent[1]];
      const xScale = d3
        .scaleLinear()
        .domain(xDomain)
        .range([PADDING, width - PADDING]);
      const yScale = d3
        .scaleLinear()
        .domain(yDomain)
        .range([height - PADDING, PADDING]);

      const byCluster = d3.group(points, (p) => p.cluster);

      hullLayer
        .selectAll<SVGGElement, [number, Point[]]>("g")
        .data([...byCluster.entries()], ([cluster]) => cluster)
        .join("g")
        .attr("class", styles.scatterHull)
        .each(function ([cluster, members]) {
          const group = d3.select(this);
          group.selectAll("*").remove();
          const screenPoints: [number, number][] = members.map((p) => [
            xScale(p.x),
            yScale(p.y),
          ]);
          const hull = d3.polygonHull(screenPoints);
          const centroid = hull
            ? d3.polygonCentroid(hull)
            : degenerateHullCentroid(screenPoints);

          if (hull) {
            group
              .append("path")
              .attr("class", styles.scatterHullPath)
              .attr("d", `M${hull.map((p) => p.join(",")).join("L")}Z`);
          } else {
            group
              .append("circle")
              .attr("class", styles.scatterHullRing)
              .attr("cx", centroid[0])
              .attr("cy", centroid[1])
              .attr("r", 16);
          }

          group
            .append("text")
            .attr("class", styles.scatterHullLabel)
            .attr("x", centroid[0])
            .attr("y", centroid[1])
            .text(`C${String(cluster + 1)}`);
        });

      const circles = pointLayer
        .selectAll<SVGCircleElement, Point>("circle")
        .data(points, (p) => p.psalm)
        .join("circle")
        .attr("class", styles.scatterPoint)
        .attr("r", 5)
        .attr("cx", (p) => xScale(p.x))
        .attr("cy", (p) => yScale(p.y))
        .attr("fill", (p) => coloring.colorOf(p.psalm))
        .on("click", (_event, p) => {
          handlers.current.onSelect(p.psalm);
        });
      circles.selectAll("title").remove();
      circles
        .append("title")
        .text((p) => `Psalm ${String(p.psalm)} — Cluster ${String(p.cluster + 1)}`);

      applySelectionStyle();
    };

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(container);
    render();

    return () => {
      resizeObserver.disconnect();
      applyRef.current = null;
      container.innerHTML = "";
    };
  }, [coloring, method, psalms]);

  useEffect(() => {
    applyRef.current?.(selected);
  }, [selected]);

  return (
    <div
      className={`${styles.scatterContainer}${lowConfidence ? ` ${styles.isLowConfidence}` : ""}`}
      ref={containerRef}
    />
  );
}
